# @semantq/auth

Authentication module for Semantq full-stack projects. Ships with Postgres, MySQL, and Supabase (Prisma) schemas. Provides complete authentication flow including signup, email confirmation, login, and password recovery.

## Table of Contents

- [Installation](#installation)
- [Automatic Installation with Semantq CLI](#automatic-installation-with-semantq-cli)
- [Manual Installation](#manual-installation)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
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

Configure the following environment variables in your `.env` or `server.config.js` file:

| Variable | Description | Required |
|-|-|-|
| `DATABASE_URL` | Database connection string | Yes |
| `RESEND_API_KEY` | Resend API key for email sending | Yes |
| `FROM_EMAIL` | Sender email address for auth emails | Yes |
| `APP_URL` | Your application URL | Yes |
| `NODE_ENV` | `development` or `production` | Yes |
| `DEV_DOMAIN` | Development domain (if needed) | No |
| `LIVE_DOMAIN` | Production domain (if needed) | No |


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
2. Confirmation email is sent via Resend
3. User must click confirmation link to activate account

### Login

Only activated users can log in. Session is managed via HTTP-only cookies.

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

Future versions may move cookie configuration to `.env` variables.

### CSS Styling

Frontend auth UI styling can be modified at:
```
project_root/public/auth/css/auth.css
```

Customize colors and theme by modifying CSS variables in `:root` or rewrite entire styles as needed.

### Moving Module for Permanent Customization

**Important**: Never customize files inside `node_modules`. Any changes there will be wiped on deployments (Render, Heroku, Fly.io, etc.) because deployment builds pull modules fresh from npm.

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
- Email service requires valid Resend API keys in production environment
- Session validation can be modified via `cookies.js` configuration


## API Reference

### Exported Modules

| Module | Description |
|--|-|
| `authRoutes` | Express routes for authentication endpoints |
| `authService` | Core authentication logic |
| `email` | Email sending service (Resend) |
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

**Q: Can I use a different email service instead of Resend?**
A: Currently only Resend is supported. You would need to modify the email service file after moving the module to `packages/`.

**Q: Are there default password validation rules?**
A: Yes, standard secure password rules are enforced (minimum length, complexity requirements).

**Q: How do I test email functionality locally?**
A: Use the included `test-email-service.js` script after configuring Resend API keys in `.env`.

**Q: What happens to existing users if I modify the Prisma schema?**
A: You will need to create and run migrations carefully. Use `prisma migrate dev` for development and `prisma migrate deploy` for production.