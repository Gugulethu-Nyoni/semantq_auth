# @semantq/auth

Authentication module for Semantq full-stack projects. Ships with Postgres, MySQL, and Supabase (Prisma) schemas. Provides complete authentication flow including signup, email confirmation, login, and password recovery.

## Table of Contents

- [Installation](#installation)
- [Automatic Installation with Semantq CLI](#automatic-installation-with-semantq-cli)
- [Manual Installation](#manual-installation)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Server Configuration](#server-configuration)
- [Module Structure](#module-structure)
- [Authentication Flow](#authentication-flow)
- [Customization](#customization)
  - [Cookie Configuration](#cookie-configuration)
  - [CSS Styling](#css-styling)
  - [Moving Module for Permanent Customization](#moving-module-for-permanent-customization)
- [Deployment Notes](#deployment-notes)
- [API Reference](#api-reference)
- [FAQ](#faq)



## Installation

### Automatic Installation with Semantq CLI

When creating a full-stack Semantq application, the auth module is installed automatically:

```bash
semantq create myapp --fullstack
```
or
```bash
semantq create myapp -fs
```

This command:
- Creates a Semantq frontend application
- Creates a `semantqQL` directory for the backend
- Installs `@semantq/auth` in the backend
- Installs auth UI components and pages in the frontend

### Manual Installation

To install the module in an existing SemantqQL backend:

```bash
npm i @semantq/auth
```



## Database Setup

The module includes Prisma schemas for three database types. You need to integrate the appropriate schema into your `semantqQL/prisma/schema.prisma` file.

### Available Schemas

The module ships with schema files in its Prisma directory. Copy the relevant schema content to your application's `schema.prisma` file based on your database:

- **Postgres** - from `node_modules/@semantq/auth/prisma/postgres/schema.prisma`
- **MySQL** - from `node_modules/@semantq/auth/prisma/mysql/schema.prisma`
- **Supabase** - from `node_modules/@semantq/auth/prisma/supabase/schema.prisma`

After adding the schema, run Prisma migrations:

```bash
npx prisma migrate dev --name init_auth
npx prisma generate
```



## Environment Configuration

Configure the following environment variables in your `.env` file:

| Variable | Description | Required |
|-|-|-|
| `NODE_ENV` | `development` or `production` | Yes |
| `PORT` | Server port (default: 3003) | No |
| `FRONTEND_BASE_URL` | Frontend application URL | Yes |
| `BASE_URL` | Backend API URL | Yes |
| `DATABASE_URL` | Database connection string | Yes |
| `EMAIL_DRIVER` | Email provider (`resend`, `mailgun`, `smtp`) | Yes |
| `RESEND_API_KEY` | Resend API key (if using Resend) | Conditional |
| `EMAIL_FROM` | Sender email address | Yes |
| `EMAIL_FROM_NAME` | Sender display name | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Yes |

### Email Configuration Options

The module reads email settings from `.env`:

**For Resend (default):**
```
EMAIL_DRIVER=resend
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@sender.somedomain.com
EMAIL_FROM_NAME="Semantq Auth"
```

**For Mailgun:**
```
EMAIL_DRIVER=mailgun
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=mg.yourdomain.com
EMAIL_FROM=noreply@sender.somedomain.com
EMAIL_FROM_NAME="Semantq Auth"
```

**For SMTP:**
```
EMAIL_DRIVER=smtp
SMTP_HOST=smtp.yourhost.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_FROM=noreply@sender.somedomain.com
EMAIL_FROM_NAME="Semantq Auth"
```



## Server Configuration

The module integrates with your `server.config.js` file. The following configuration values are used by the auth module:

### Database Connections

The module uses the database configuration defined in `server.config.js`:

```javascript
database: {
  default: process.env.DB_DEFAULT || 'postgres',
  connections: {
    mysql: { ... },
    postgres: { ... }
  }
}
```

The `DATABASE_URL` environment variable takes precedence for Prisma connections.

### Email Configuration

Auth reads email settings from the `email` section of `server.config.js`:

```javascript
email: {
  driver: process.env.EMAIL_DRIVER || 'resend',
  debug: process.env.EMAIL_DEBUG === 'true',
  resend_api_key: process.env.RESEND_API_KEY,
  email_from: process.env.EMAIL_FROM,
  email_from_name: process.env.EMAIL_FROM_NAME,
}
```

### Brand Configuration

Auth uses brand settings for email templates and redirects:

```javascript
brand: {
  name: process.env.BRAND_NAME || 'Semantq Academy',
  support_email: process.env.BRAND_SUPPORT_EMAIL,
  frontend_base_url: process.env.FRONTEND_BASE_URL,
}
```

### CORS Configuration

Allowed origins are read from `allowedOrigins` in `server.config.js` to handle cross-origin authentication requests.



## Module Structure

When installed in `node_modules/@semantq/auth/`:

```
@semantq/auth/
├── bin/
│   ├── init.js
│   └── migrate.js
├── config/
│   └── cookies.js
├── controllers/
├── lib/
├── middleware/
├── utils/
├── LICENSE
├── migrations_repo/
│   ├── mysql/
│   ├── prisma/
│   └── supabase/
├── models/
│   └── index.js
├── migrations/
│   ├── mysql/
│   └── supabase/
├── package.json
├── README.md
├── routes/
│   └── authRoutes.js
├── services/
│   ├── authService.js
│   ├── email.js
│   ├── password.js
│   ├── strategies/
│   └── test-email-service.js
└── test-email.js
```

Routes from this module are automatically mounted when the module is installed in `node_modules`.



## Authentication Flow

### Signup

User provides:
- Name (required)
- Email (required)
- Username (optional, minimum 8 characters, unique, no special characters)
- Password (standard secure password rules)

Upon submission:
1. User account is created in `pending` state
2. Confirmation email is sent via configured email driver
3. User must click confirmation link to activate account

### Login

Only activated users can log in. Session is managed via HTTP-only cookies using JWT.

### Password Recovery

1. User requests password reset via email
2. Reset link is sent to registered email
3. User sets new password via the reset link



## Customization

### Cookie Configuration

Session cookie behavior can be customized in `config/cookies.js`. The default configuration:

```javascript
import dotenv from 'dotenv';
dotenv.config();

export const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
    
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    path: '/',
  };
};
```

To modify cookie settings:
- Adjust `maxAge` for session duration (value is in milliseconds)
- Modify `sameSite` policy as needed
- The `domain` attribute is intentionally omitted - browser defaults to server host

### CSS Styling

Frontend auth UI styling can be modified at:
```
project_root/public/auth/css/auth.css
```

Customize colors and theme by modifying CSS variables in `:root` or rewrite entire styles as needed.

### Moving Module for Permanent Customization

Important: Never customize files inside `node_modules`. Any changes there will be wiped on deployments (Render, Heroku, Fly.io, etc.) because deployment builds pull modules fresh from npm.

To make permanent customizations to the auth module:

1. Move the module from `node_modules/@semantq/auth` to `semantqQL/packages/@semantq/auth/`

2. Remove the module from `package.json` dependencies so it is not reinstalled on `npm install` or during builds/deployments

3. Update any import paths that reference `@semantq/auth` to point to the new location:
   - Change from: `import something from '@semantq/auth/...'`
   - Change to: `import something from '../packages/@semantq/auth/...'`

The SemantqQL CLI will automatically detect and mount routes from the `packages` directory once the module is moved there.



## Deployment Notes

- Do not make customizations inside `node_modules` for any deployment platform
- The module must be moved to `semantqQL/packages/` for permanent changes
- Remove the module from `package.json` after moving to prevent automatic reinstallation
- Email service requires valid API keys in production environment (Resend, Mailgun, or SMTP)
- Session validation can be modified via `cookies.js` configuration
- Ensure `FRONTEND_BASE_URL` is correctly set in production for email confirmation and password reset links
- JWT secret should be a strong, unique value in production



## API Reference

### Exported Modules

| Module | Description |
|--|-|
| `authRoutes` | Express routes for authentication endpoints |
| `authService` | Core authentication logic |
| `email` | Email sending service (supports Resend, Mailgun, SMTP) |
| `password` | Password hashing and validation |
| `strategies` | Authentication strategies |

### Default Routes

| Method | Path | Description |
|--||-|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/logout` | Logout user |
| POST | `/auth/confirm/:token` | Confirm email address |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password/:token` | Reset password |
| GET | `/auth/me` | Get current user session |



## FAQ

**Q: What happens if username is not provided during signup?**
A: Username is optional. Only name, email, and password are required.

**Q: Which email providers are supported?**
A: Resend (default), Mailgun, and SMTP. Configure using `EMAIL_DRIVER` in `.env`.

**Q: What are the default password validation rules?**
A: Standard secure password rules are enforced (minimum length, complexity requirements).

**Q: How do I test email functionality locally?**
A: Use the included `test-email-service.js` script after configuring email API keys in `.env`.

**Q: What happens to existing users if I modify the Prisma schema?**
A: You will need to create and run migrations carefully. Use `prisma migrate dev` for development and `prisma migrate deploy` for production.

**Q: Does the module support JWT-based authentication?**
A: Yes. JWT is used for session management with configurable expiry via `JWT_ACCESS_EXPIRY` environment variable.

**Q: How do I configure CORS for authentication requests?**
A: Add your frontend URLs to the `allowedOrigins` array in `server.config.js`.