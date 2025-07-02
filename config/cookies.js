//config/cookies.js

import dotenv from 'dotenv';
dotenv.config();

console.log('Current NODE_ENV:', process.env.NODE_ENV);
//console.log('Using domain:', process.env[`${process.env.NODE_ENV === 'development' ? 'DEV' : 'LIVE'}_DOMAIN`]);

export const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'strict',
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
  ...(process.env.NODE_ENV !== 'development' && {
    domain: process.env[`${process.env.NODE_ENV === 'development' ? 'DEV' : 'LIVE'}_DOMAIN`],
  }),
});

//console.log(getCookieOptions());


