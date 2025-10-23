// test-mail.js
import dotenv from 'dotenv';
dotenv.config();
import { sendMail } from './src/utils/mailer.js';

(async () => {
  try {
    const info = await sendMail({
      to: process.env.MAIL_USER,
      subject: 'Test Email from Phish-MVP',
      html: '<h3>Test Email — SMTP ok</h3>',
    });
    console.log('Send success:', info);
  } catch (e) {
    console.error('Send failed:', e);
  } finally {
    process.exit();
  }
})();
