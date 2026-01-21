// semantq_auth/models/index.js
import fs from 'fs/promises'; // Use fs.promises for consistency
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Adjust relative path for config_loader.js.
// Current file: semantq_server/packages/semantq_auth/models/index.js
// Target: semantqQL/config_loader.js
// Path: ../../../config_loader.js is correct.
import loadConfigPromise from '../../../../config_loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Await the loaded configuration (top-level await)
const config = await loadConfigPromise();

// Get the database adapter configured in server.config.js
const adapterName = config.database?.adapter; // Use optional chaining for safety
if (!adapterName) {
  throw new Error(
    'No database adapter configured in server.config.js (loaded via config_loader). Please set `database.adapter`.'
  );
}

// --- IMPORTANT: Dynamic Database Adapter Initialization ---
let initializedDbAdapter = null; // This variable will hold the initialized adapter instance

try {
  // Construct the path to the chosen adapter module (e.g., semantq_server/models/adapters/supabase.js)
  // Current file: semantq_server/packages/semantq_auth/models/index.js
  // Target: semantq_server/models/adapters/{adapterName}.js
  // Path: ../../../../models/adapters/{adapterName}.js
  const adapterModulePath = pathToFileURL(
    path.join(__dirname, '../../../../models/adapters', `${adapterName}.js`)
  ).href;

  // Dynamically import the adapter module
  // This will load the actual adapter file (e.g., supabase.js from semantq_server/models/adapters/)
  const { default: loadedAdapterModule } = await import(adapterModulePath);

  // Call the init method on the loaded adapter, passing its specific configuration
  // The adapter's init method should return the initialized client or the adapter itself
  initializedDbAdapter = await loadedAdapterModule.init(config.database.config);
  console.log(`✅ Database adapter '${adapterName}' initialized successfully.`);

} catch (error) {
  console.error(`💥 Error initializing database adapter '${adapterName}':`, error);
  // Provide more specific context for initialization errors if possible
  if (error.message.includes('URL and Key must be provided')) {
    console.error('Please ensure SUPABASE_URL and SUPABASE_KEY are set in your .env file or server.config.js for the Supabase adapter.');
  }
  throw new Error(`Failed to initialize database adapter '${adapterName}': ${error.message}`);
}
// --- END IMPORTANT: Dynamic Database Adapter Initialization ---


// Directory containing adapter-specific models for *this package* (e.g., semantq_auth/models/supabase)
const modelsDir = path.join(__dirname, adapterName); // adapterName here refers to the directory name (e.g., 'supabase')

// Object to hold all dynamically loaded model functions (will be used for named exports)
const models = {};

try {
  // Read all files in the adapter's model directory
  const files = await fs.readdir(modelsDir);

  for (const file of files) {
    if (file.endsWith('.js')) {
      const modelFileName = path.basename(file, '.js'); // e.g., 'user' or 'session'

      // Convert the model file path to a file URL for dynamic import
      const modulePath = pathToFileURL(path.join(modelsDir, file)).href;

      // Dynamically import the model module
      const modelModule = await import(modulePath);

      // Add all named exports from the model file directly to the 'models' object
      // This flattens all functions from all model files into a single object.
      // Make sure there are no name collisions between functions in different model files.
      for (const [key, value] of Object.entries(modelModule)) {
        if (typeof value === 'function') { // Only include functions for named exports
            models[key] = value;
        } else if (key === 'default') {
            // If the module has a default export that is an object of functions,
            // also spread those into the 'models' object.
            if (typeof value === 'object' && value !== null) {
                for (const [defaultKey, defaultValue] of Object.entries(value)) {
                    if (typeof defaultValue === 'function') {
                        models[defaultKey] = defaultValue;
                    }
                }
            }
        }
      }

      console.log(`✅ Loaded model functions from: ${modelFileName}.js`);
    }
  }
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error(
      `💥 Error: Models directory not found for adapter '${adapterName}' at ${modelsDir}`
    );
    console.error('Please ensure the adapter directory (e.g., `semantq_auth/models/supabase/`) and model files (e.g., `user.js`) exist within your `semantq_auth` package.');
  } else {
    console.error(`💥 Error loading models for adapter '${adapterName}':`, error);
  }
  throw error; // Critical error, rethrow
}

// Export all collected model functions as named exports.
// This allows consumers to do: import { findUserByEmail, createUser } from '../models/index.js';
// This list must include every function you intend to expose from any model file
// (e.g., user.js, session.js) within this 'semantq_auth' package's model directory.
export const {
  findUserByEmail,
  findUserByUsername,          // NEW: For username lookup
  findUserByEmailOrUsername,   // NEW: For login with email OR username
  createUser,
  findUserByVerificationToken,
  verifyUserById,
  findUserById,
  storePasswordResetToken,
  findUserByPasswordResetToken,
  updatePasswordAndClearResetToken,
  // Add other model functions here as they are defined in your adapter's model files.
  // For example, if you had a 'session.js' that exports 'createSession', add it here:
  // createSession,
  // findSessionById,
} = models; // This destructuring will ensure these are available as named exports.

// Also export a default object containing all collected model functions (for compatibility/alternative access)
// This allows consumers to do: import models from '../models/index.js'; and then access models.findUserByEmail
export default models;