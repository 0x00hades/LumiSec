// src/utils/mailer.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// لـ dev: فعل اللوج علشان تشوف تفاصيل الاتصال
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.MAIL_PORT) || 465,
  secure: process.env.MAIL_SECURE === 'true' || true, // true for 465
  auth: {
    user: process.env.MAIL_USER || '', // تأكد هنا إن القيم مش فاضية
    pass: process.env.MAIL_PASS || '', // App Password من جوجل
  },
  logger: true,
  debug: true,
  tls: {
    // للاختبار المحلي فقط — إذا واجهت مشاكل TLS جرب تفعّله مؤقتاً
    rejectUnauthorized: false,
  },
});

// فحص سريع (DEV) - طباعة إذا كانت المتغيرات محمّلة (لا تطبع كلمة السر في productie)
if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
  console.warn('⚠️ MAIL_USER or MAIL_PASS is missing. Check your .env');
}

export async function sendMail({ to, subject, html, from }) {
  const mailOptions = {
    from: from || process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    html,
  };
  return transporter.sendMail(mailOptions);
}
// console.log('MAIL_USER set?', !!process.env.MAIL_USER || !!process.env.EMAIL);
// console.log('MAIL_PASS set? ', (process.env.MAIL_PASS || process.env.EMAIL_PASSWORD) ? `yes (len=${(process.env.MAIL_PASS||process.env.EMAIL_PASSWORD).length})` : 'no');
