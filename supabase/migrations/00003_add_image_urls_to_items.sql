-- Add image_url column to all tables
ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE found_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE returned_items ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update lost items with image URLs
UPDATE lost_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/762abd8a-8f7b-4ead-a9c1-0a5e1fb4b0bc.jpg' WHERE item_name LIKE '%Apple Watch%';
UPDATE lost_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/499c6876-232a-4da7-af43-6dfb2c889ae1.jpg' WHERE item_name LIKE '%iPhone%';
UPDATE lost_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/b54ffdf2-3ece-40c9-a807-de5fbc47bb1f.jpg' WHERE item_name LIKE '%MacBook%';
UPDATE lost_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/6a787cdf-cf01-41f4-acba-a4ed2d0338ef.jpg' WHERE item_name LIKE '%iPad%';
UPDATE lost_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/bee53489-cb5e-4845-96da-c595c4c604b8.jpg' WHERE item_name LIKE '%Surface%';
UPDATE lost_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/9ca99713-154a-4d40-800e-0833553986dc.jpg' WHERE item_name LIKE '%AirPods%';
UPDATE lost_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/68c33195-d2b9-4a14-b257-3d3b00d7ff4a.jpg' WHERE item_name LIKE '%Galaxy Buds%';
UPDATE lost_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/45381a01-10c3-4ac6-a8b8-f9e1d522d11c.jpg' WHERE item_name LIKE '%Sony%' OR item_name LIKE '%Headphones%';
UPDATE lost_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/f6b42884-0a0b-4b9f-b959-23be3b58f651.jpg' WHERE category = 'Wallet' OR item_name LIKE '%Wallet%';
UPDATE lost_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/aab2f3c9-bcc7-447d-a279-1239fdc11666.jpg' WHERE category = 'Bag' OR item_name LIKE '%Backpack%' OR item_name LIKE '%Bag%';
UPDATE lost_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/acd1e11a-9e8b-4a65-8ff5-1f39361560fb.jpg' WHERE category = 'Keys' OR item_name LIKE '%Key%';
UPDATE lost_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/1df14cf6-4069-4ac8-a21c-916ce3cd3871.jpg' WHERE category = 'Books' OR item_name LIKE '%Textbook%' OR item_name LIKE '%Book%';
UPDATE lost_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/68d27b80-8a06-4b5f-b74c-2c2b170ffc71.jpg' WHERE category = 'Jewelry' OR item_name LIKE '%Necklace%' OR item_name LIKE '%Bracelet%';
UPDATE lost_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/5efe0bf7-5602-426f-b5b5-039481f803e2.jpg' WHERE item_name LIKE '%Passport%' OR category = 'Documents';
UPDATE lost_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/c9a8d4f5-7cb7-47ef-b53c-56b7b41c83a3.jpg' WHERE item_name LIKE '%Pandora%';
UPDATE lost_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/822f8510-5dab-4cf1-97b1-a8b4ba67cee3.jpg' WHERE item_name LIKE '%Tiffany%';

-- Update found items with image URLs
UPDATE found_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/1b4d9d67-144f-4c77-9885-aa2e57037c42.jpg' WHERE item_name LIKE '%Beats%';
UPDATE found_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/a24d7135-c9c7-48de-88cf-8dbcdd13b055.jpg' WHERE item_name LIKE '%Kindle%';
UPDATE found_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/9603fc8b-0e74-4bc7-912c-578c4bdf0281.jpg' WHERE item_name LIKE '%GoPro%';
UPDATE found_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/e52ee8dd-82c9-48fb-a107-300ad7c2a264.jpg' WHERE item_name LIKE '%Switch%';
UPDATE found_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/7785753c-823d-4765-b50e-c185a97ebbaf.jpg' WHERE item_name LIKE '%Fossil%';
UPDATE found_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/f6b42884-0a0b-4b9f-b959-23be3b58f651.jpg' WHERE category = 'Wallet' OR item_name LIKE '%Wallet%';
UPDATE found_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/aab2f3c9-bcc7-447d-a279-1239fdc11666.jpg' WHERE category = 'Bag' OR item_name LIKE '%Backpack%' OR item_name LIKE '%Bag%';
UPDATE found_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/acd1e11a-9e8b-4a65-8ff5-1f39361560fb.jpg' WHERE category = 'Keys' OR item_name LIKE '%Key%';
UPDATE found_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/e3d8cb46-75e1-4869-a5c7-727c71c8df6e.jpg' WHERE item_name LIKE '%Physics%';
UPDATE found_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/d8efa8be-a4e8-4a59-9592-5de03e90bf76.jpg' WHERE item_name LIKE '%Chemistry%';
UPDATE found_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/d1bc5f2d-9ef9-478d-afa7-04ade63d705b.jpg' WHERE item_name LIKE '%Sunglasses%';
UPDATE found_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/723538ed-e56c-4a82-aff4-8629d905e7cf.jpg' WHERE item_name LIKE '%Cartier%';
UPDATE found_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/16d2314e-1323-4bb1-b260-9116cf589611.jpg' WHERE item_name LIKE '%Medical%';

-- Update returned items with image URLs
UPDATE returned_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/b54ffdf2-3ece-40c9-a807-de5fbc47bb1f.jpg' WHERE item_name LIKE '%MacBook%';
UPDATE returned_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/b3719161-476f-44a3-afc1-f04a7439ef68.jpg' WHERE item_name LIKE '%Vera Bradley%';
UPDATE returned_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/aab2f3c9-bcc7-447d-a279-1239fdc11666.jpg' WHERE item_name LIKE '%Patagonia%' OR item_name LIKE '%Backpack%';
UPDATE returned_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/3ea1a01f-62f3-4a17-abe8-9db9081f9f48.jpg' WHERE item_name LIKE '%Rolex%';
UPDATE returned_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/67718302-fc5e-4fa6-a982-922fa7d8c682.jpg' WHERE item_name LIKE '%Glasses%' OR item_name LIKE '%Prescription%';
UPDATE returned_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/762abd8a-8f7b-4ead-a9c1-0a5e1fb4b0bc.jpg' WHERE item_name LIKE '%Watch%' AND item_name NOT LIKE '%Rolex%';
UPDATE returned_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/f6b42884-0a0b-4b9f-b959-23be3b58f651.jpg' WHERE item_name LIKE '%Wallet%';
UPDATE returned_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/aab2f3c9-bcc7-447d-a279-1239fdc11666.jpg' WHERE item_name LIKE '%Bag%';
UPDATE returned_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/acd1e11a-9e8b-4a65-8ff5-1f39361560fb.jpg' WHERE item_name LIKE '%Key%';
UPDATE returned_items SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/6bb1a4a2-9cb4-4a63-ad1d-4321ad7b9a79.jpg' WHERE item_name LIKE '%USB%' OR item_name LIKE '%Drive%';