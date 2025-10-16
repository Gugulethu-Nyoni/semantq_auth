//config/cookies.js

import dotenv from 'dotenv';
dotenv.config();

console.log('Current NODE_ENV:', process.env.NODE_ENV);
//console.log('Using domain:', process.env[`${process.env.NODE_ENV === 'development' ? 'DEV' : 'LIVE'}_DOMAIN`]);

/*
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
*/

export const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  // ... (console.log, etc.)
    
  return {
    httpOnly: true,
    secure: isProduction,
    // Must be 'none' for cross-site communication (front end on different domain)
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
    // *** REMOVE THE 'domain' ATTRIBUTE ***
    // The browser defaults to the host (your server's host, e.g., api.onrender.com)
    // and that is what you want.
  };
};
//console.log(getCookieOptions());


