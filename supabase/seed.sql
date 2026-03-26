-- Generate UUIDs for properties
-- First insert properties with explicit UUIDs, then inspections

-- Properties with explicit IDs for consistent referencing
INSERT INTO properties (id, house_name, house_number, street_name, area, town, postcode, type, form, age, floors, location, condition, living_rooms, bedrooms, bathrooms, cloaks, utility, garage, conservatory, floor_area, latitude, longitude) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Willow House', '12', 'Church Lane', 'Newtown', 'Birmingham', 'B15 3PH', 'House', 'Detached', 1925, '2', 8, 'Good', 2, 4, 2, 1, 1, 'GGE', 1, 1450, 52.4832, -1.8901),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'The Cottage', '45', 'High Street', 'Town Centre', 'Manchester', 'M1 5NG', 'House', 'Semi Detached', 1935, '2', 6, 'Average', 2, 3, 1, 0, 1, 'DG', 0, 980, 53.4808, -2.2426),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Flat 7', '7', 'Portland Drive', 'West End', 'London', 'W1T 4LP', 'Flat', 'Purpose Built', 1970, '4', 7, 'Good', 1, 2, 1, 0, 0, 'PS', 0, 650, 51.5074, -0.1278),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Riverside', '3', 'River Road', 'Riverside', 'Bristol', 'BS1 2AB', 'Bungalow', 'Detached', 1980, '1', 9, 'Good', 2, 3, 2, 1, 1, 'DG', 1, 1200, 51.4545, -2.5879),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'The Terrace', '22', 'Victoria Street', 'Central', 'Leeds', 'LS1 6DP', 'House', 'End Terraced', 1900, '3', 5, 'Poor', 2, 2, 1, 1, 1, 'None', 0, 850, 53.7955, -1.5490),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Maple View', '89', 'Oak Avenue', 'Suburbs', 'Liverpool', 'L18 8DJ', 'House', 'Semi Detached', 1965, '2', 7, 'Average', 2, 3, 1, 1, 1, 'GGE', 1, 1100, 53.4000, -2.9833),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'Apartment 12', '12', 'King Street', 'City Centre', 'Glasgow', 'G1 2AA', 'Flat', 'Converted', 1890, '3', 8, 'Good', 1, 1, 1, 0, 0, 'None', 0, 550, 55.8642, -4.2518),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'Hilltop', '5', 'South Road', 'Hillside', 'Sheffield', 'S10 1AB', 'House', 'Detached', 1955, '2', 6, 'Average', 3, 4, 2, 1, 1, 'DG', 1, 1350, 53.3811, -1.4701),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'Elm House', '34', 'Elm Street', 'Eastside', 'Newcastle', 'NE1 6AA', 'House', 'Mid Terraced', 1910, '2', 5, 'Average', 2, 2, 1, 0, 1, 'None', 0, 750, 54.9783, -1.6178),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'Seaside Villa', '67', 'Coastal Road', 'Seafront', 'Brighton', 'BN1 1AA', 'House', 'Detached', 1930, '2', 9, 'Good', 3, 4, 2, 1, 1, 'DG', 1, 1600, 50.8225, -0.1372);

-- Inspections using the property IDs
INSERT INTO inspections (property_id, reference, inspection_type, status, valuation, sale_price, price_per_sqm, inspection_date, notes) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'INS001', 'Valuation', 'Completed', 245000, NULL, 169, '2025-12-10', 'Property in good condition, modern kitchen fitted in 2020'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'INS002', 'Sale', 'Under Offer', 185000, 180000, 189, '2025-11-22', 'Recently renovated bathroom'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'INS003', 'H2B Sale', 'For Sale', 320000, 335000, 492, '2025-10-15', 'Prime location, excellent transport links'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'INS004', 'SO Repayment', 'Completed', 275000, NULL, 229, '2025-09-08', 'Quiet residential area'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'INS005', 'Sale', 'Exchanged', 145000, 140000, 171, '2025-08-30', 'Needs some modernization'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'INS006', 'Valuation', 'Completed', 210000, NULL, 191, '2025-12-01', 'Good family home'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'INS007', 'H2B Repayment', 'Completed', 195000, NULL, 355, '2025-07-18', 'City centre location'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'INS008', 'Sale', 'Under Offer', 285000, 280000, 211, '2025-11-05', 'Large garden, detached garage'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'INS009', 'Other', 'For Sale', 155000, NULL, 207, '2025-10-28', 'Mid terrace, good starter home'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'INS010', 'SO Sale', 'Completed', 450000, 445000, 281, '2025-06-14', 'Sea views, premium location');