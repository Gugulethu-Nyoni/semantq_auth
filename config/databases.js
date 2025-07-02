// config/databases.js

const mysqlConfig = {
  host: process.env.DB_MYSQL_HOST,
  port: process.env.DB_MYSQL_PORT,
  user: process.env.DB_MYSQL_USER,
  password: process.env.DB_MYSQL_PASSWORD,
  database: process.env.DB_MYSQL_NAME,
  poolLimit: process.env.DB_MYSQL_POOL_LIMIT,
};

const supabaseConfig = {
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  dbConnectionString: process.env.SUPABASE_DB_CONNECTION_STRING,
};

export default {
  mysql: mysqlConfig,
  supabase: supabaseConfig,
};
