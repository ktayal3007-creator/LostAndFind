-- Create lost_items table
CREATE TABLE lost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  date_lost TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  campus TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  additional_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create found_items table
CREATE TABLE found_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  date_found TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  campus TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  additional_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create returned_items table
CREATE TABLE returned_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_contact TEXT,
  finder_name TEXT NOT NULL,
  finder_contact TEXT,
  return_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  campus TEXT NOT NULL,
  story TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert test data for lost_items
INSERT INTO lost_items (item_name, description, category, date_lost, location, campus, contact_name, contact_email, contact_phone, additional_info) VALUES
('Black Leather Wallet', 'Black leather wallet with multiple card slots. Contains student ID and credit cards.', 'Wallet', '2025-12-20 14:30:00+00', 'Main Library, 3rd Floor', 'North Campus', 'John Smith', 'john.smith@university.edu', '555-0101', 'Last seen near study area'),
('Blue Backpack', 'Navy blue Jansport backpack with laptop compartment. Has a small tear on the front pocket.', 'Bag', '2025-12-19 10:15:00+00', 'Engineering Building, Room 205', 'South Campus', 'Emily Chen', 'emily.chen@university.edu', '555-0102', 'Contains textbooks and notebooks'),
('Silver iPhone 13', 'Silver iPhone 13 with cracked screen protector. Black case with floral pattern.', 'Electronics', '2025-12-18 16:45:00+00', 'Student Center Cafeteria', 'Central Campus', 'Michael Brown', 'michael.brown@university.edu', '555-0103', 'Left on table near entrance'),
('Red Water Bottle', 'Stainless steel red Hydro Flask water bottle with stickers.', 'Personal Items', '2025-12-17 09:20:00+00', 'Gym Locker Room', 'West Campus', 'Sarah Johnson', 'sarah.johnson@university.edu', '555-0104', 'Has university logo sticker'),
('Prescription Glasses', 'Black frame prescription glasses in brown leather case.', 'Accessories', '2025-12-16 13:00:00+00', 'Science Lab Building, Lab 3', 'North Campus', 'David Lee', 'david.lee@university.edu', '555-0105', 'Very important, needed for classes'),
('Car Keys', 'Toyota car keys with blue keychain and gym membership tag.', 'Keys', '2025-12-15 18:30:00+00', 'Parking Lot B', 'South Campus', 'Jessica Martinez', 'jessica.martinez@university.edu', '555-0106', 'Urgent - need to get home'),
('Textbook - Calculus II', 'Calculus II textbook, 8th edition, with yellow cover. Name written inside.', 'Books', '2025-12-14 11:45:00+00', 'Mathematics Building, Lecture Hall 1', 'Central Campus', 'Robert Taylor', 'robert.taylor@university.edu', '555-0107', 'Has notes and highlights'),
('White Airpods', 'White Apple Airpods in charging case. Case has initials "AM" engraved.', 'Electronics', '2025-12-13 15:20:00+00', 'Library Study Room 4', 'North Campus', 'Amanda Miller', 'amanda.miller@university.edu', '555-0108', 'Left in study room');

-- Insert test data for found_items
INSERT INTO found_items (item_name, description, category, date_found, location, campus, contact_name, contact_email, contact_phone, additional_info) VALUES
('Gray Laptop Charger', 'MacBook Pro charger with USB-C connector. Cable slightly frayed.', 'Electronics', '2025-12-20 15:00:00+00', 'Computer Science Building, Room 101', 'South Campus', 'Kevin Wilson', 'kevin.wilson@university.edu', '555-0201', 'Found under desk'),
('Pink Umbrella', 'Light pink folding umbrella with floral pattern.', 'Personal Items', '2025-12-19 12:30:00+00', 'Bus Stop near Main Gate', 'Central Campus', 'Lisa Anderson', 'lisa.anderson@university.edu', '555-0202', 'Left at bus stop'),
('Student ID Card', 'University student ID card for Alex Thompson, Class of 2026.', 'ID Cards', '2025-12-18 14:15:00+00', 'Dining Hall', 'West Campus', 'Mark Davis', 'mark.davis@university.edu', '555-0203', 'Found on floor near cashier'),
('Black Notebook', 'Black spiral notebook with chemistry notes. Name not visible.', 'Books', '2025-12-17 10:45:00+00', 'Chemistry Building, Lecture Hall 2', 'North Campus', 'Rachel Green', 'rachel.green@university.edu', '555-0204', 'Contains detailed lab notes'),
('Wireless Mouse', 'Logitech wireless mouse, black color. Battery still working.', 'Electronics', '2025-12-16 16:00:00+00', 'Library Computer Lab', 'North Campus', 'Tom Harris', 'tom.harris@university.edu', '555-0205', 'Found on desk'),
('Blue Scarf', 'Navy blue knitted scarf, very soft material.', 'Accessories', '2025-12-15 08:30:00+00', 'Arts Building Entrance', 'Central Campus', 'Nina Patel', 'nina.patel@university.edu', '555-0206', 'Hanging on railing'),
('USB Flash Drive', '32GB SanDisk USB flash drive, black. Contains files.', 'Electronics', '2025-12-14 13:45:00+00', 'Business School, Room 305', 'South Campus', 'Chris Martin', 'chris.martin@university.edu', '555-0207', 'Found in classroom'),
('Green Water Bottle', 'Green plastic water bottle, half full.', 'Personal Items', '2025-12-13 17:20:00+00', 'Track and Field', 'West Campus', 'Olivia White', 'olivia.white@university.edu', '555-0208', 'Left on bleachers');

-- Insert test data for returned_items
INSERT INTO returned_items (item_name, description, category, owner_name, owner_contact, finder_name, finder_contact, return_date, location, campus, story) VALUES
('Brown Leather Wallet', 'Brown leather wallet with driver license and cash.', 'Wallet', 'James Wilson', 'james.wilson@university.edu', 'Sophie Turner', 'sophie.turner@university.edu', '2025-12-12 14:00:00+00', 'Student Union', 'Central Campus', 'Found in restroom and returned same day. Owner was very grateful!'),
('MacBook Air Laptop', 'Silver MacBook Air 13-inch with university stickers.', 'Electronics', 'Daniel Kim', 'daniel.kim@university.edu', 'Emma Roberts', 'emma.roberts@university.edu', '2025-12-10 16:30:00+00', 'Library Study Area', 'North Campus', 'Left on study desk. Contacted owner through email found in lost & found system.'),
('Gold Bracelet', 'Gold bracelet with heart charm, sentimental value.', 'Jewelry', 'Maria Garcia', 'maria.garcia@university.edu', 'Alex Johnson', 'alex.johnson@university.edu', '2025-12-08 11:00:00+00', 'Gym Locker Room', 'West Campus', 'Found near lockers. Owner was extremely happy to get it back!'),
('Passport', 'US Passport belonging to international student.', 'Documents', 'Li Wei', 'li.wei@university.edu', 'Sarah Connor', 'sarah.connor@university.edu', '2025-12-05 09:30:00+00', 'International Student Office', 'Central Campus', 'Critical document returned quickly. Student needed it for travel.'),
('Prescription Medication', 'Important daily medication in orange bottle.', 'Medical', 'Robert Johnson', 'robert.johnson@university.edu', 'Jennifer Lee', 'jennifer.lee@university.edu', '2025-12-03 15:45:00+00', 'Health Center', 'South Campus', 'Urgent medication returned within hours of being found.'),
('House Keys', 'Set of house keys with multiple keys and car remote.', 'Keys', 'Patricia Brown', 'patricia.brown@university.edu', 'Michael Scott', 'michael.scott@university.edu', '2025-12-01 12:20:00+00', 'Parking Structure', 'North Campus', 'Found in parking lot. Owner was locked out and very relieved!');

-- Create indexes for better query performance
CREATE INDEX idx_lost_items_created_at ON lost_items(created_at DESC);
CREATE INDEX idx_lost_items_campus ON lost_items(campus);
CREATE INDEX idx_lost_items_category ON lost_items(category);
CREATE INDEX idx_found_items_created_at ON found_items(created_at DESC);
CREATE INDEX idx_found_items_campus ON found_items(campus);
CREATE INDEX idx_found_items_category ON found_items(category);
CREATE INDEX idx_returned_items_return_date ON returned_items(return_date DESC);

-- Enable Row Level Security (RLS) but allow public access for now
ALTER TABLE lost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE found_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE returned_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no authentication required)
CREATE POLICY "Allow public read access to lost_items" ON lost_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert to lost_items" ON lost_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access to found_items" ON found_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert to found_items" ON found_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access to returned_items" ON returned_items FOR SELECT USING (true);