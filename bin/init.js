#!/usr/bin/env node

import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const questions = [
  {
    type: 'list',
    name: 'database',
    message: 'Choose your database:',
    choices: ['MySQL', 'Supabase', 'SQLite', 'MongoDB'],
    default: process.env.DB_ADAPTER 
      ? process.env.DB_ADAPTER.charAt(0).toUpperCase() + process.env.DB_ADAPTER.slice(1)
      : 'MySQL'
  },
  {
    type: 'list',
    name: 'emailService',
    message: 'Select email provider:',
    choices: ['Resend', 'Mailgun', 'SMTP', 'Sendgrid', 'None'],
    default: process.env.EMAIL_DRIVER 
      ? process.env.EMAIL_DRIVER.charAt(0).toUpperCase() + process.env.EMAIL_DRIVER.slice(1)
      : 'Resend'
  },
  {
    type: 'confirm',
    name: 'includeUI',
    message: 'Include built-in auth UI?',
    default: true
  }
];

async function runInit() {
  // Verify .env exists
  try {
    await fs.access(path.join(process.cwd(), '.env'));
  } catch {
    console.error('❌ Error: .env file not found. Please create it first.');
    process.exit(1);
  }

  const answers = await inquirer.prompt(questions);

  const configDir = path.join(process.cwd(), 'config');
  await fs.mkdir(configDir, { recursive: true });

  // Build authentique.config.js content with module references
  const configContent = `import dotenv from 'dotenv';
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
    adapter: '${answers.database.toLowerCase()}',
    config: databaseConfig['${answers.database.toLowerCase()}']
  },
  email: {
    provider: '${answers.emailService}',
    config: emailConfig
  },
  features: {
    ui: ${answers.includeUI}
  }
};
`;

  // Write authentique.config.js
  await fs.writeFile(path.join(configDir, 'authentique.config.js'), configContent);

  console.log(`
✅ Configuration generated and saved at:

- config/authentique.config.js ✅

✔️ Remember to update up your 'config/databases.js' and 'config/auth.js' modules accordingly.
`);
}

runInit();
