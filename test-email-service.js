// test-email-service.js

import { emailServicePromise } from './services/email.js';

async function testEmailService() {
  try {
    console.log('🚀 Starting EmailService test...');
    const emailService = await emailServicePromise;
    console.log('✅ EmailService initialized');
    
    await emailService.sendTestEmail('gugunnn@gmail.com');
    console.log('🎉 EmailService test completed successfully!');
  } catch (error) {
    console.error('❌ EmailService test failed:', error);
  }
}

testEmailService();