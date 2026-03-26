-- Update Michael's role to admin
UPDATE user_profiles 
SET role = 'admin', can_view_all = true 
WHERE id = '8887281b-ba19-4be0-bada-09d3c5db1b6c';

-- Also insert if not exists (in case trigger didn't work)
INSERT INTO user_profiles (id, role, can_view_all)
VALUES ('8887281b-ba19-4be0-bada-09d3c5db1b6c', 'admin', true)
ON CONFLICT (id) DO UPDATE SET role = 'admin', can_view_all = true;