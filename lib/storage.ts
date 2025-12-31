import { supabase } from '@/db/supabase';

const BUCKET_NAME = 'app-8e6wgm5ndzi9_item_images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
  url: string | null;
  error: string | null;
}

/**
 * Upload an image file to Supabase storage
 * @param file - The image file to upload
 * @param folder - Optional folder name (e.g., 'lost_items', 'found_items')
 * @returns Object with url and error
 */
export async function uploadImage(
  file: File,
  folder: string = 'items'
): Promise<UploadResult> {
  try {
    // Validate file size (5MB maximum)
    if (file.size > MAX_FILE_SIZE) {
      return {
        url: null,
        error: 'Image size must be less than or equal to 5MB',
      };
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return {
        url: null,
        error: 'Only JPG, PNG, and WEBP images are allowed',
      };
    }

    // Generate unique filename using snake_case
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${folder}/${timestamp}_${randomStr}.${fileExt}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        url: null,
        error: error.message || 'Failed to upload image',
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      error: null,
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return {
      url: null,
      error: 'An unexpected error occurred during upload',
    };
  }
}

/**
 * Delete an image from Supabase storage
 * @param url - The public URL of the image to delete
 * @returns Boolean indicating success
 */
export async function deleteImage(url: string): Promise<boolean> {
  try {
    // Extract file path from URL
    const urlParts = url.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) {
      return false;
    }
    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete exception:', error);
    return false;
  }
}
