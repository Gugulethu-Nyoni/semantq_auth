import dotenv from 'dotenv';
dotenv.config();

import databaseConfig from './databases.js';
import emailConfig from './auth.js';

const isProd = process.env.NODE_ENV === 'production';

export default {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  baseUrl: process.env.BASE_URL || (isProd ? 'https://example.com' : 'http://localhost:3000'),
  brand: {
    name: process.env.BRAND_NAME || 'ExampleBrandName',
    supportEmail: process.env.BRAND_SUPPORT_EMAIL || 'support@example.com'
  },
  database: {
    adapter: 'mysql',
    config: databaseConfig['mysql']
  },
  email: {
    provider: 'Resend',
    config: emailConfig
  },
  features: {
    ui: true
  }
};
