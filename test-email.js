// semantqQL/node_modules/@semantq/auth/test-email.js
import { Resend } from 'resend';
import loadConfig from '../../../config_loader.js'; // This is a function, not the config

async function sendTestEmail() {
  try {
    // ✅ FIXED: Call the function to get the config
    const config = await loadConfig();
    
    console.log('Config loaded successfully:', {
      hasEmail: !!config?.email,
      emailKeys: config?.email ? Object.keys(config.email) : [],
      topLevelKeys: Object.keys(config || {})
    });
    
    const apiKey = config?.email?.resend_api_key;
    const fromEmail = config?.email?.email_from;

    if (!apiKey) {
      throw new Error('Missing resend_api_key in your config file.');
    }

    if (!fromEmail) {
      throw new Error('Missing email_from in your config file.');
    }

    const resend = new Resend(apiKey);

    const response = await resend.emails.send({
      from: fromEmail,
      to: 'gugunnn@gmail.com',
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