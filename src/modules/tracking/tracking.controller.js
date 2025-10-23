import Recipient from '../../../database/models/Recipient.js';
import Event from '../../../database/models/Event.js';

const ONE_BY_ONE_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

/**
 * 🔹 API: /track/open/:recipientId
 * ✅ لما المستخدم يفتح الإيميل، الصورة دي بتتحمل تلقائيًا
 */
export async function trackOpen(req, res) {
  try {
    const { recipientId } = req.params;
    const recipient = await Recipient.findById(recipientId);

    // لو الـ recipientId غلط أو مش موجود
    if (!recipient) {
      console.warn(`⚠️ Invalid tracking pixel request for non-existent recipientId: ${recipientId}`);
      return res.status(404).send('Recipient not found');
    }

    // دالة لتصنيف نوع الفتح
    function classifyOpen(req) {
      const ua = (req.headers['user-agent'] || '').toLowerCase();
    
      if (
        ua.includes('googleimageproxy') ||
        ua.includes('fetcher') ||
        ua.includes('apple') && ua.includes('mail') ||
        ua.includes('cloudflare') ||
        ua.includes('amazon') ||
        ua.includes('proxy')
      ) return 'proxy';
    
      if (ua.includes('mozilla') && !ua.includes('bot') && !ua.includes('proxy')) return 'human';
      if (ua.includes('outlook')) return 'human';
      if (ua.includes('postman') || ua.includes('bot') || ua.includes('crawler')) return 'bot';
      
      return 'unknown';
    }
    

    // جلب معلومات الطلب
    const clientInfo = {
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      referer: req.headers['referer'] || 'none',
      type: classifyOpen(req),
    };

    // طباعة التفاصيل في اللوج
    console.log('📩 Open tracking request:', clientInfo);

    // تسجيل الـ event الحقيقي
    await Event.create({
      campaignId: recipient.campaignId,
      recipientId,
      eventType: 'open',
      meta: clientInfo,
    });

    // تحديد نوع الفتح في الكونسول
    if (clientInfo.type === 'human') {
      console.log(`✅ Email likely opened by a human user for recipient ${recipientId} or by server`);
    } else if (clientInfo.type === 'proxy') {
      console.log(`🟡 Email opened via image proxy (e.g. Gmail or Apple Mail) for recipient ${recipientId}`);
    } else if (clientInfo.type === 'bot') {
      console.log(`🤖 Bot or security scanner triggered the pixel for recipient ${recipientId}`);
    } else {
      console.log(`⚪ Unknown open source for recipient ${recipientId}`);
    }

    // إعداد الهيدرز الخاصة بالصورة
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // إرسال الصورة 1×1
    return res.status(200).end(ONE_BY_ONE_GIF);
  } catch (err) {
    console.error('❌ trackOpen error:', err);
    res.status(500).send('Server error');
  }
}


/**
 * 🔹 API: /track/click/:recipientId?to=<URL>
 * ✅ لما المستخدم يضغط على اللينك داخل الإيميل
 */
export async function trackClick(req, res) {
  try {
    const { recipientId } = req.params;
    const to = String(req.query.to || '').trim();

    if (!recipientId) {
      return res.status(400).send('Missing recipientId');
    }

    const recipient = await Recipient.findById(recipientId);
    if (recipient) {
      await Event.create({
        campaignId: recipient.campaignId,
        recipientId,
        eventType: 'click',
        to,
        ts: new Date(),
      });
    }

    // توجيه المستخدم للوجهة الأصلية أو لصفحة آمنة
    const destination = to && /^https?:\/\//i.test(to) ? to : '/safe_page';
    return res.redirect(destination);
  } catch (err) {
    console.error('trackClick error:', err);
    res.status(500).send('Server error');
  }
}

/**
 * 🔹 API: /safe_page
 * ✅ صفحة توضيحية بعد الضغط على لينك غير حقيقي
 */
export function safePage(req, res) {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Safe Page</title>
      </head>
      <body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1>You are safe.</h1>
        <p>This was a simulated phishing exercise.</p>
      </body>
    </html>
  `);
}
