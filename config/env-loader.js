import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

//console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });
//console.log('✅ .env loaded successfully');
