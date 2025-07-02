//semantq_server/models/supabase/user.js
import supabaseAdapter from '../../../../models/adapters/supabase.js';

// Helper to get single row or null
async function getSingleRow(query) {
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

// Find user by email
export const findUserByEmail = async (email) => {
  return await getSingleRow(
    supabaseAdapter.from('users').select('*').eq('email', email)
  );
};

// Create new user
export const createUser = async (user) => {
  const { data, error } = await supabaseAdapter.from('users')
    .insert([{
      name: user.name || null,
      email: user.email || null,
      password_hash: user.password_hash || null,
      verification_token: user.verification_token || null,
      verification_token_expires_at: user.verification_token_expires_at || null
    }])
    .select('id');

  if (error) throw error;
  if (!data || !data[0]) throw new Error('User creation failed, no record returned.');

  return data[0].id;
};

// Find user by verification token
export const findUserByVerificationToken = async (token) => {
  return await getSingleRow(
    supabaseAdapter.from('users').select('*').eq('verification_token', token)
  );
};

// Mark user as verified by ID
export const verifyUserById = async (userId) => {
  const { error } = await supabaseAdapter.from('users').update({
    is_verified: true,
    verification_token: null,
    verification_token_expires_at: null
  }).eq('id', userId);

  if (error) throw error;
};

// Find user by ID
export const findUserById = async (id) => {
  return await getSingleRow(
    supabaseAdapter.from('users').select('id,email,name').eq('id', id)
  );
};

// Store password reset token
export const storePasswordResetToken = async (userId, token, expiresAt) => {
  const { error } = await supabaseAdapter.from('users').update({
    reset_token: token,
    reset_token_expires_at: expiresAt
  }).eq('id', userId);

  if (error) throw error;
};

// Find user by password reset token (and not expired)
export const findUserByPasswordResetToken = async (token) => {
  return await getSingleRow(
    supabaseAdapter.from('users')
      .select('*')
      .eq('reset_token', token)
      .gt('reset_token_expires_at', new Date().toISOString())
  );
};

// Update password and clear reset token
export const updatePasswordAndClearResetToken = async (userId, newPasswordHash) => {
  const { error } = await supabaseAdapter.from('users').update({
    password_hash: newPasswordHash,
    reset_token: null,
    reset_token_expires_at: null
  }).eq('id', userId);

  if (error) throw error;
};
