## 📖 Authentique

**Framework-Agnostic User Authentication Package – Semantq Native**

---

## 🚀 MCSR Auth Stack

A lightweight, framework-agnostic authentication system supporting:

* ✅ Multiple databases (MySQL, SQLite, Supabase, MongoDB)
* ✅ Social auth (GitHub, Google, Facebook, Twitter)
* ✅ Email auth flows (Resend/Mailgun/SMTP)

---

## 📦 Installation & Setup

### 1️⃣ Install Package

```bash
npm install authentique
```

---

### 2️⃣ Initialize Configuration

Run interactive setup:

```bash
npm run setup
```

You’ll be prompted for:

* Database type (MySQL/Supabase/SQLite/MongoDB)
* Email provider (Resend/Mailgun/SMTP)
* Whether to include a built-in auth UI

Example:

```bash
? Choose your database: MySQL
? Select email provider: Resend
? Include built-in auth UI? Yes

✅ Configuration complete!
```

---

### 3️⃣ Configure Environment

Ensure your `.env` file contains required variables:

```ini
# === Core ===
BRAND_NAME=ExampleBrand
BRAND_SUPPORT_EMAIL=support@example.com
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000
UI_BASE_URL=http://localhost:3001

# === Database ===
# ===== MySQL/MariaDB =====
DB_ADAPTER=mysql
DB_MYSQL_HOST=localhost
DB_MYSQL_PORT=3306
DB_MYSQL_USER=root
DB_MYSQL_PASSWORD=mypassword
DB_MYSQL_NAME=auth
DB_MYSQL_POOL_LIMIT=10

# === Auth ===
JWT_SECRET=your_long_jwt_secret_here
JWT_ACCESS_EXPIRY=15m

# === Email ===
EMAIL_DRIVER=resend  # resend|mailgun|smtp
EMAIL_FROM=noreply@emailer.approveddomain.com
EMAIL_FROM_NAME=ExampleBrand

# --- Resend ---
RESEND_API_KEY=re_xxx

# --- Mailgun ---
# MAILGUN_API_KEY=key-xxx
# MAILGUN_DOMAIN=mg.yourdomain.com

# --- SMTP ---
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=user
# SMTP_PASS=pass

# --- Supabase ---
# SUPABASE_URL=https://xxx.supabase.co
# SUPABASE_KEY=anon_key

# --- SQLite ---
# SQLITE_PATH=./data/db.sqlite

# --- MongoDB ---
# MONGO_URI=mongodb://user:pass@host:27017/dbname

```

---

### 4️⃣ Verify Installation

Confirm generated config files:

```bash
ls config/
# Should show:
# authentique.config.js
# databases.js
# env-loader.js
```

## 📦 Database Migrations

Authentique uses a simple migration system to manage your database schema over time. Migrations are organized by adapter in:

```
src/adapters/databases/<adapter>/migrations/
```

For example for MySQL:

```
src/adapters/databases/mysql/migrations/
```

Each migration file must export an `up(pool)` function to apply changes, and optionally a `down(pool)` function to rollback.


---

## 📦 Migration Repositories

Authentique provides **starter migration files** for supported databases to help you quickly set up the necessary tables for authentication functionality.

These starter migrations are located under:

```
authentique/lib/migration_repos/
```

### 📂 Available Migration Repositories:

* `mysql/` — SQL migrations for MySQL/MariaDB
* `supabase/` — SQL migration files for Supabase (PostgreSQL)

---

## 📑 How to Use

After installing Authentique, you can optionally copy these migrations into your project’s own migration directories to initialize your database schema.

### 🐬 MySQL:

* **Source:**
  `authentique/lib/migration_repos/mysql/`

* **Destination:**
  `authentique/src/adapters/mysql/migrations/`

**Example:**

```bash
cp authentique/lib/migration_repos/mysql/* authentique/src/adapters/mysql/migrations/
```
or you can copy these manually 
---

### 🐘 Supabase:

* **Source:**
  `authentique/lib/migration_repos/supabase/`

* **Destination:**
  `supabase/migrations/` *(inside your Supabase CLI project directory)*

**Example:**

```bash
cp authentique/lib/migration_repos/supabase/* supabase/migrations/
```

---

## ⚠️ Important Notice

> **Do not mix MySQL migrations with Supabase/PostgreSQL projects.**
> The **file formats, naming conventions, and SQL dialect** differ between MySQL and Supabase.

* **MySQL**: Uses `.sql` files with MySQL-specific syntax.
* **Supabase**: Uses timestamped SQL files compatible with PostgreSQL migrations run via the Supabase CLI.

Ensure you copy the correct migration files into the appropriate project directories.

---

## 📖 Additional Notes

You’re free to modify, extend, or replace these starter migrations to suit your project’s needs. These are provided as a baseline for setting up the required authentication-related tables such as:

* `users`
* `sessions`
* `oauth_tokens` (for OAuth strategies)

---

### 📜 Running Migrations

To run all pending migrations:

```bash
npm run migrate
```

This will:

* Check for a `migrations` table (and create it if missing)
* Find all `.js` migration files in the adapter’s `migrations/` directory
* Skip any migrations already logged in the `migrations` table
* Run pending migrations sequentially
* Log each applied migration into the `migrations` table

---

### 🔙 Rolling Back Migrations

To rollback the **latest migration**:

```bash
npm run migrate:rollback
```

To rollback a specific number of recent migrations:

```bash
npm run migrate:rollback <number>
```

**Examples:**

* Rollback the last 1 migration:

  ```bash
  npm run migrate:rollback
  ```

* Rollback the last 3 migrations:

  ```bash
  npm run migrate:rollback 3
  ```

* Rollback all applied migrations:

  ```bash
  npm run migrate:rollback 999
  ```

**Note:** Only migrations with a `down(pool)` function can be rolled back. Migrations without one will be skipped with a warning.

---

### 📄 Example Migration File for MySQL

```javascript
// src/adapters/databases/mysql/migrations/0001-create-users.js

export async function up(pool) {
  await pool.query(`
    CREATE TABLE users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      email VARCHAR(255) UNIQUE NOT NULL
    )
  `);
}

export async function down(pool) {
  await pool.query(`DROP TABLE IF EXISTS users`);
}
```

---

### ✅ Migration Logging

* Applied migrations are tracked in a `migrations` table:

  ```sql
  SELECT * FROM migrations;
  ```
* Each entry records the migration filename and when it was run.

---

## 📦 Database Migration Commands

| Command                          | Description                                                         | Example                        |
|:---------------------------------|:--------------------------------------------------------------------|:-------------------------------|
| `npm run init`                   | Runs the interactive configuration wizard to set up project config. | `npm run init`                  |
| `npm run migrate`                | Runs all pending database migrations not yet recorded in the migrations log. | `npm run migrate`               |
| `npm run migrate:rollback`       | Rolls back the latest applied migration (1 step).                    | `npm run migrate:rollback`      |
| `npm run migrate:rollback <N>`   | Rolls back the specified number of latest applied migrations.        | `npm run migrate:rollback 2`    |
| `npm run migrate:rollback 999`   | Rolls back **all** applied migrations (safe upper limit).             | `npm run migrate:rollback 999`  |
| `npm run migrate:refresh`        | Rolls back all migrations and re-applies them from scratch.           | `npm run migrate:refresh`       |
| `npm run setup`                  | Runs init, migrates the database, and starts both API and UI servers concurrently. | `npm run setup`                 |

---

## 📂 Migrations Directory Structure

Migrations are stored per adapter:

```
src/adapters/databases/<adapter>/migrations/
```

## 📖 Authentique UI Configuration

**Authentique UI** is a fully optional, lightweight user interface layer that ships alongside the **Authentique authentication package**. It provides a clean, modular, and extensible frontend to support full authentication workflows out of the box — without requiring a JavaScript framework.

**Note:** All you need to do to set up Authentique UI is to update the variables in the `config.js` file — that’s it.

Perfect — here’s your clean, updated **feature-based directory structure section** for the README, reflecting your exact latest layout, with `OLDindex.html` removed and `project/` replaced with `ui/` as requested:

---

## 📁 Project Directory Structure

Authentique UI follows a **feature-based directory structure** for clarity and scalability:

```
ui/
├── auth/
│   ├── confirm.html
│   ├── email-confirmation.html
│   ├── forgot-password.html
│   ├── index.html
│   ├── login.html
│   ├── reset-password.html
│   ├── signup.html
│   ├── verify-email.html
│   ├── css/
│   └── js/
│       ├── config.js               # UI runtime config (API endpoints & environment)
│       ├── login.js                # Login form logic
│       ├── signup.js               # Signup form logic
│       ├── forgot-password.js      # Forgot password form logic
│       └── reset-password.js       # Password reset form logic
├── dashboard/
│   ├── account.html
│   ├── css/
│   ├── index.html
│   └── js/
├── node_modules/
├── package-lock.json
├── package.json
├── server/
│   ├── middleware/
│   ├── routes/
│   └── test.js
└── ui-server.js                    # Express UI server with API proxy routes
```

---

## ⚙️ UI Capabilities

Authentique UI includes:

* **User signup**
  With support for multiple database adapters as configured in your **Authentique backend setup**:

  * MySQL
  * Supabase
  * MongoDB
  * SQLite

* **Email-based account confirmation**
  New users must confirm their email address before login is permitted.

* **Secure email and password login**
  Authentication is JWT-based and secured via **HttpOnly cookies**.
  These tokens are **never accessible from frontend JavaScript** and are confined to backend-managed cookies.

* **Email-based password recovery**
  Users can request a password reset via email, with secure token-based confirmation.

* **Automatic redirection to a prebuilt authentication dashboard template**
  Upon login, users are automatically redirected to a prebuilt authentication dashboard template. This dashboard serves as a flexible foundation that you can easily customize to fit your application's unique requirements. By running database migrations with Authentique backends and extending the Authentique UI, you can quickly build a full-stack CRUD application with minimal effort. The solution is framework-agnostic but optimized for the Semantq JS framework, giving you maximum flexibility and speed in development.

---

## 🔒 Security Model

Authentique UI makes all authentication API calls via **frontend proxy routes**, preventing the frontend from making direct cross-origin requests to the authentication backend.
JWT tokens are stored in **HttpOnly cookies** set by the backend — these cookies are:

* Not accessible via JavaScript
* Automatically included in API requests to authenticated endpoints
* Secure and domain-confined

---

## 📂 Configuring the Backend API Endpoint

All Authentique UI scripts that communicate with the backend load a configuration object from:

```
authentiqueui/auth/js/config.js
```

This defines the environment and base backend API URLs dynamically based on the current host, or allows for manual environment selection.

---

## 📜 `config.js` Structure

```js
/**
 * AppConfig
 * 
 * Application runtime configuration for Authentique UI.
 * 
 * ENV can either be set dynamically based on the window location
 * or manually for testing/dev purposes by assigning a fixed value:
 * 
 * Example:
 *   ENV: 'development'
 *   ENV: 'production'
 * 
 * BASE_URLS can be customized to point to your backend's dev or production
 * environment as needed.
 */
const AppConfig = {
  // Automatically detect the environment, or set manually for testing
  ENV: (typeof window !== 'undefined' && window.location.hostname.includes('localhost'))
    ? 'development'
    : 'production',

  // Define your backend API base URLs for different environments
  BASE_URLS: {
    development: 'http://localhost:3000',
    production: 'https://api.botaniqsa.com'
  },

  /**
   * Dynamically returns the base API URL for the current environment
   */
  get BASE_URL() {
    return this.BASE_URLS[this.ENV] || this.BASE_URLS.development;
  }
};

export default AppConfig;
```

---

## 📦 How Config Is Imported and Used

Each Authentique UI module that requires access to backend API endpoints **imports `AppConfig` from the config file**. So you don't need to do this - it s already taken care of - all you need to do is update the variaables in the config.js file. 

Example:

```js
import AppConfig from './config.js';
```

API paths are then constructed using `AppConfig.BASE_URL` like this:

```js
const PATHS = {
  FORGOT_PASSWORD_API: `${AppConfig.BASE_URL}/api/forgot-password`, // Assuming backend is on 3000
  LOGIN_PAGE: '/login' // Assuming your login page is at /login
};
```

This ensures your frontend modules automatically target the correct API environment without needing to hardcode endpoint URLs.

---

## 📌 Important Notes:

* The **config file must be located at:**
  `authentiqueui/auth/js/config.js`
* No staging environment is included by default.
  The provided environments are:

  * `development` (for localhost testing)
  * `production` (for live deployment)

If necessary, you can extend the `BASE_URLS` object for additional environments as required for your own project.

Sure — here’s a clean, refined, and clear markdown section for your README that avoids re-showing the full config code while explaining the dashboard config neatly:

---

## 🎛️ UI Configuration: Connecting to the Backend API

The **optional built-in UI** ui-server.js provided with Authentique requires a correctly configured API endpoint to communicate with the backend authentication service.

By default, the UI is served from within the `authentique/` directory and reads the target backend API URL from the main `.env` file in the project root:

```javascript
import fetch from 'node-fetch';
import 'dotenv/config';

const API_BASE_URL = process.env.API_BASE_URL;
if (!API_BASE_URL) {
  console.error('❌ Missing API_BASE_URL in environment!');
  process.exit(1);
}
```

---

### ⚙️ How This Works:

* The **UI server** (located in: `authentique/ui/ui-server.js`) reads the `API_BASE_URL` environment variable at runtime.
* This value tells the UI server where to proxy frontend authentication requests (login, signup, token validation, etc.) to the Authentique backend.

---

### 📌 Important:

* **You must ensure that your `.env` file has a valid `API_BASE_URL` defined** if you're using the provided UI.
* This is especially critical if you move the UI outside of the `authentique/` directory or deploy the frontend separately from the backend.

---

### 📝 Example `.env`:

```
API_BASE_URL=http://localhost:3000
```

---

### 🚨 Custom Project Setups:

If you integrate Authentique into a custom project structure:

* Make sure to adjust the environment variable setup accordingly.
* Alternatively, modify the `API_BASE_URL` retrieval logic in your custom UI server or configuration files to match your project’s conventions.

**Key principle:**

> *The UI server must have a way to resolve and use the correct backend API endpoint at runtime for Authentique to function properly.*



### **Authentique UI Dashboard**

The default URL for the Authentique dashboard is set via the `DASHBOARD` variable in the `config.js` file:

```javascript
DASHBOARD: '/dashboard/index.html',
```

You can customize this path to point to your preferred dashboard location if needed. The `config.js` file also manages environment-specific settings and API base URLs, making it simple to configure your application for both development and production environments.

**Note:** If you change the dashboard directory, you’ll also need to update the `authentique/ui/server/routes/dashboard.routes.js` file to reflect the new directory:

```javascript
export default function (app, serveDirectory) {
  serveDirectory('dashboard', '/dashboard', true); // any logged-in user
}
```

This function tells the UI server to serve all routes and files within the specified directory without needing to define individual routes for each file — ensuring seamless access for authenticated users.



