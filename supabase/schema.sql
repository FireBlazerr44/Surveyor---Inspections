-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_name VARCHAR(255),
  house_number VARCHAR(50),
  street_name VARCHAR(255),
  area VARCHAR(255),
  town VARCHAR(255),
  postcode VARCHAR(10),
  type VARCHAR(30),
  form VARCHAR(50),
  age INTEGER,
  floors TEXT,
  location INTEGER,
  condition VARCHAR(20),
  living_rooms INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  cloaks INTEGER,
  utility INTEGER,
  garage VARCHAR(10),
  conservatory INTEGER,
  floor_area INTEGER,
  notes TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inspections table
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  reference VARCHAR(10) UNIQUE,
  inspection_type VARCHAR(20),
  status VARCHAR(20),
  valuation DECIMAL(12,2),
  sale_price DECIMAL(12,2),
  price_per_sqm DECIMAL(10,2),
  inspection_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'user',
  can_view_all BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_properties_postcode ON properties(postcode);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_form ON properties(form);
CREATE INDEX IF NOT EXISTS idx_inspections_property_id ON inspections(property_id);
CREATE INDEX IF NOT EXISTS idx_inspections_reference ON inspections(reference);
CREATE INDEX IF NOT EXISTS idx_inspections_inspection_date ON inspections(inspection_date);

-- RLS Policies
-- Properties: Allow all authenticated users to read
CREATE POLICY "Allow all authenticated to read properties" ON properties
  FOR SELECT TO authenticated USING (true);

-- Properties: Allow insert for authenticated users
CREATE POLICY "Allow authenticated to insert properties" ON properties
  FOR INSERT TO authenticated WITH CHECK (true);

-- Properties: Allow update for authenticated users
CREATE POLICY "Allow authenticated to update properties" ON properties
  FOR UPDATE TO authenticated USING (true);

-- Inspections: Allow all authenticated users to read
CREATE POLICY "Allow all authenticated to read inspections" ON inspections
  FOR SELECT TO authenticated USING (true);

-- Inspections: Allow insert for authenticated users
CREATE POLICY "Allow authenticated to insert inspections" ON inspections
  FOR INSERT TO authenticated WITH CHECK (true);

-- Inspections: Allow update for authenticated users
CREATE POLICY "Allow authenticated to update inspections" ON inspections
  FOR UPDATE TO authenticated USING (true);

-- User profiles: Allow read for authenticated users
CREATE POLICY "Allow authenticated to read user_profiles" ON user_profiles
  FOR SELECT TO authenticated USING (true);

-- User profiles: Allow insert for authenticated users
CREATE POLICY "Allow authenticated to insert user_profiles" ON user_profiles
  FOR INSERT TO authenticated WITH CHECK (true);

-- User profiles: Allow update for authenticated users
CREATE POLICY "Allow authenticated to update user_profiles" ON user_profiles
  FOR UPDATE TO authenticated USING (true);

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role, can_view_all)
  VALUES (NEW.id, 'user', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();