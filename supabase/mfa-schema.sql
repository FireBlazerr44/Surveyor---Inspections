-- Add MFA fields to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(64);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT[];

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_mfa_enabled ON user_profiles(mfa_enabled) WHERE mfa_enabled = true;