import path from 'path';
import fs from 'fs';
import csv from 'csv-parser';
import { AppError } from '../../utils/appError.js';
import Campaign from '../../../database/models/Campaign.js';
import Recipient from '../../../database/models/Recipient.js';
import Event from '../../../database/models/Event.js';
import { isDomainAllowed } from '../../utils/allowedDomains.js';
import { sendMail } from '../../utils/mailer.js';


const SEND_DELAY_MS = Number(process.env.SEND_DELAY_MS || 700);

// optional: simple retry helper
async function retry(fn, attempts = 3, delayMs = 1000) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) { lastErr = e; if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs)); }
  }
  throw lastErr;
}

function buildEmailHtml(template, recipient) {
  const openPixelUrl = `${process.env.BASE_URL || ''}/track/open/${recipient._id}`;
  // const clickUrl = `${process.env.BASE_URL || ''}/track/click/${recipient._id}`;
  const clickUrl = `https://facebook.com`;
  let html = String(template);
  html = html.replaceAll('{{user_name}}', recipient.user_name);
  html = html.replaceAll('{{open_pixel}}', `<img src='https://karsyn-uncriticized-jayna.ngrok-free.dev/track/open/{{recipientId}}' width='1' height='1' alt='' style='display:none;' />`);
  html = html.replaceAll('{{click_url}}', `${clickUrl}`);
  return html;
}


async function createCampaign(req, res, next) {
  const { name, template } = req.body || {};
  if (!name || !template) return next(new AppError('name and template are required', 400));
  const campaign = await Campaign.create({ name, template });
  return res.status(201).json({ campaign });
}

async function uploadRecipients(req, res, next) {
  const { campaignId } = req.params;
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) return next(new AppError('campaign_not_found', 404));
  if (!req.file) return next(new AppError('file_required', 400));

  const rows = [];
  const { Readable } = await import('stream');
  const bufferStream = new Readable();
  bufferStream.push(req.file.buffer);
  bufferStream.push(null);

  await new Promise((resolve, reject) => {
    bufferStream
      .pipe(csv({ headers: ['email', 'user_name'], skipLines: 0 }))
      .on('data', (row) => rows.push(row))
      .on('error', reject)
      .on('end', resolve);
  });

  const accepted = [];
  const rejected = [];
  for (const row of rows) {
    const email = String(row.email || '').trim();
    const user_name = String(row.user_name || '').trim();
    if (!email || !user_name || !isDomainAllowed(email)) {
      rejected.push({ email, user_name, reason: 'invalid_or_disallowed' });
      continue;
    }
    accepted.push({ email, user_name });
  }

  const createdRecipients = [];
  for (const r of accepted) {
    try {
      // حفظ المستلم في DB
      const recipient = await Recipient.create({ campaignId: campaign._id, email: r.email, user_name: r.user_name });
      createdRecipients.push(recipient);
      await Event.create({ campaignId: campaign._id, recipientId: recipient._id, eventType: 'sent' });

      // بناء الـ HTML مع الـ tracking links
      const html = buildEmailHtml(campaign.template, recipient);

      // حفظ محلي للـ audit
      try {
        const filePath = path.join(process.cwd(), 'sent_emails', `email_${recipient._id}.html`);
        fs.writeFileSync(filePath, html, 'utf8');
      } catch (fsErr) {
        // لا توقف العملية لو فشل الحفظ المحلي، بس سجّل
        console.error('Failed to write sent email file:', fsErr);
      }

      // ارسال فعلي عبر nodemailer مع retry بسيط
      try {
        await retry(() => sendMail({
          to: recipient.email,
          subject: `Campaign: ${campaign.name}`,
          html,
        }), 3, 1000);

        await Event.create({ campaignId: campaign._id, recipientId: recipient._id, eventType: 'delivered' });
      } catch (mailErr) {
        console.error('Mail send error for', recipient.email, mailErr);
        rejected.push({ email: r.email, user_name: r.user_name, reason: 'mail_error', details: String(mailErr.message || mailErr) });
        await Event.create({ campaignId: campaign._id, recipientId: recipient._id, eventType: 'delivery_failed', to: recipient.email });
      }

      // تأخير بسيط بين الإرسالات لتقليل فرص الحظر
      await new Promise((res) => setTimeout(res, SEND_DELAY_MS));
    } catch (err) {
      console.error('Recipient create or DB error:', err);
      rejected.push({ email: r.email, user_name: r.user_name, reason: 'db_error', details: String(err.message || err) });
    }
  }

  return res.json({
    accepted_count: accepted.length,
    created_count: createdRecipients.length,
    rejected_count: rejected.length,
    rejected,
  });
}


async function metrics(req, res, next) {
  const { campaignId } = req.params;
  const total = await Recipient.countDocuments({ campaignId });
  const opens = await Event.countDocuments({ campaignId, eventType: 'open' });
  const clicks = await Event.countDocuments({ campaignId, eventType: 'click' });
  const open_rate = total > 0 ? Number(((opens / total) * 100).toFixed(2)) : 0;
  const click_rate = total > 0 ? Number(((clicks / total) * 100).toFixed(2)) : 0;
  return res.json({ total, opens, clicks, open_rate, click_rate });
}

async function exportEvents(req, res, next) {
  const { campaignId } = req.params;
  const events = await Event.find({ campaignId }).sort({ ts: 1 }).lean();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="events_${campaignId}.csv"`);
  const header = 'campaignId,recipientId,eventType,ts,to\n';
  res.write(header);
  for (const ev of events) {
    const line = `${ev.campaignId},${ev.recipientId},${ev.eventType},${new Date(ev.ts).toISOString()},${ev.to || ''}\n`;
    res.write(line);
  }
  res.end();
}

export { createCampaign, uploadRecipients, metrics, exportEvents };



