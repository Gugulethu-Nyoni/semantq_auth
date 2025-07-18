// test-email.js

import { Resend } from 'resend';
import configPromise from '../../../config_loader.js'; // adjust relative path as needed

async function sendTestEmail() {
  try {
    const config = await configPromise;
    const apiKey = config.email?.resend_api_key;
    const fromEmail = config.email?.email_from;

    if (!apiKey) {
      throw new Error('Missing resend_api_key in your config file.');
    }

    if (!fromEmail) {
      throw new Error('Missing email_from in your config file.');
    }

    const resend = new Resend(apiKey);

    const response = await resend.emails.send({
      from: fromEmail,
      to: 'youremail@example.com', // 🔁 Replace with a valid recipient email
      subject: 'Test Email from Resend (config loaded)',
      html: '<h1>Hello!</h1><p>This is a test email sent using Resend and semantq config.</p>',
      text: 'Hello! This is a test email sent using Resend.',
    });

    console.log('✅ Email sent successfully:', response);
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
  }
}

sendTestEmail();
