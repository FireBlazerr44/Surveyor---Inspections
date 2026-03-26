-- Security: Add login attempts tracking
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN DEFAULT false,
  attempt_count INTEGER DEFAULT 1,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON login_attempts(created_at);

-- Update user_profiles with security fields
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ DEFAULT NOW();

-- Add read-only role support
-- Roles: admin, user (read/write), read_only

-- Enable RLS on login_attempts
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Login attempts: allow insert for anyone (tracking)
CREATE POLICY "Allow insert login attempts" ON login_attempts
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow read login attempts for admin" ON login_attempts
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Update RLS policies for read-only users
-- Properties: Read-only users can only select
CREATE POLICY "Allow read-only to read properties" ON properties
  FOR SELECT TO authenticated USING (true);

-- Inspections: Read-only users can only select
CREATE POLICY "Allow read-only to read inspections" ON inspections
  FOR SELECT TO authenticated USING (true);