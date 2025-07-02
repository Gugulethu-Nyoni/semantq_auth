// src/models/user.js
import config from '../../config/authentique.config.js';

let UserModel;

async function loadModel() {
  if (UserModel) return UserModel;

  const adapter = config.database.adapter.toLowerCase();

  switch(adapter) {
    case 'mysql':
      UserModel = await import('./mysql/user.js');
      break;
    case 'supabase':
      UserModel = await import('./supabase/user.js');
      break;
    // Add others if needed
    default:
      throw new Error(`Unsupported adapter: ${adapter}`);
  }
  return UserModel;
}

// Proxy exports to adapter-specific model functions
export const findUserByEmail = async (...args) => {
  const model = await loadModel();
  return model.findUserByEmail(...args);
};

export const createUser = async (...args) => {
  const model = await loadModel();
  return model.createUser(...args);
};

export const findUserByVerificationToken = async (...args) => {
  const model = await loadModel();
  return model.findUserByVerificationToken(...args);
};

export const verifyUserById = async (...args) => {
  const model = await loadModel();
  return model.verifyUserById(...args);
};

export const findUserById = async (...args) => {
  const model = await loadModel();
  return model.findUserById(...args);
};

export const storePasswordResetToken = async (...args) => {
  const model = await loadModel();
  return model.storePasswordResetToken(...args);
};

export const findUserByPasswordResetToken = async (...args) => {
  const model = await loadModel();
  return model.findUserByPasswordResetToken(...args);
};

export const updatePasswordAndClearResetToken = async (...args) => {
  const model = await loadModel();
  return model.updatePasswordAndClearResetToken(...args);
};

// export any other user model functions similarly
