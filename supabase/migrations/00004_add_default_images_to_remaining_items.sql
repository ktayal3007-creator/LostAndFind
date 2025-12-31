-- Add default images for items without images
UPDATE lost_items 
SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/423f959c-a1ea-4a75-8ac2-78452347d740.jpg' 
WHERE image_url IS NULL AND category = 'ID Cards';

UPDATE lost_items 
SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/6bb1a4a2-9cb4-4a63-ad1d-4321ad7b9a79.jpg' 
WHERE image_url IS NULL;

UPDATE found_items 
SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/6bb1a4a2-9cb4-4a63-ad1d-4321ad7b9a79.jpg' 
WHERE image_url IS NULL;

UPDATE returned_items 
SET image_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/6bb1a4a2-9cb4-4a63-ad1d-4321ad7b9a79.jpg' 
WHERE image_url IS NULL;