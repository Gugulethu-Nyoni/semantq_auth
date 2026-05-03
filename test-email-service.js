// packages/@semantq/auth/test-email-service.js

import { emailServicePromise } from './services/email.js';
import loadConfigPromise from '../../../config_loader.js';

async function testEmailService() {
  try {
    console.log('Starting EmailService test with debug logs...');
    console.log('================================================');
    
    // First, check what config loader returns
    console.log('\nSTEP 1: Loading configuration...');
    const config = await loadConfigPromise();
    console.log('[Config] Email config from loader:', {
      email_from: config.email?.email_from,
      email_from_name: config.email?.email_from_name,
      driver: config.email?.driver,
      resend_api_key_exists: !!config.email?.resend_api_key,
      resend_api_key_prefix: config.email?.resend_api_key?.substring(0, 10)
    });
    console.log('[Config] Full email object:', JSON.stringify(config.email, null, 2));
    
    // Second, initialize email service
    console.log('\nSTEP 2: Initializing EmailService...');
    const emailService = await emailServicePromise(); 
    console.log('EmailService initialized');
    
    // Third, send test email
    console.log('\nSTEP 3: Sending test confirmation email...');
    await emailService.sendConfirmationEmail({
      to: 'gugunnn@gmail.com',
      name: 'Gugulethu Test',
      token: 'test-token-12345'
    });
    
    console.log('\n================================================');
    console.log('Test completed successfully');
    console.log('Check your email inbox (and spam folder)');
  } catch (error) {
    console.error('\nEmailService test failed:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

testEmailService();