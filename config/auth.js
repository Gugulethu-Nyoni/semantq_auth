export default {
        jwtSecret: process.env.JWT_SECRET,
        jwtExpiry: process.env.JWT_ACCESS_EXPIRY,
        emailDriver: process.env.EMAIL_DRIVER,
        resend: {
          apiKey: process.env.RESEND_API_KEY
        }
      }