import { createClient } from "@supabase/supabase-js";
import { supabase } from "./supabase/client";

// Initialize Supabase client
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
// const supabase = createClient(supabaseUrl, supabaseKey);

const STORAGE_BUCKET = "yadn-diagrams";
const STORAGE_PATH = "canvas-images";

interface StoredImage {
  id: string;
  src: string;
  alt: string;
  createdAt: string;
  path: string;
}

/**
 * Upload an image to Supabase storage
 */
export async function uploadImage(
  file: File,
  userId: string
): Promise<StoredImage | null> {
  try {
    // Check if user has reached the limit of 10 images
    const existingImages = await listImages(userId);
    if (existingImages.length >= 10) {
      throw new Error(
        "You have reached the maximum limit of 10 images. Please delete some images before uploading more."
      );
    }

    // Create a unique filename with user prefix
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `${STORAGE_PATH}/${fileName}`;

    // Upload the file
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading image:", error);
      throw error;
    }

    // Get the public URL for the file
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    // Return the stored image info
    return {
      id: `image-${Date.now()}`,
      src: publicUrl,
      alt: file.name,
      createdAt: new Date().toISOString(),
      path: filePath,
    };
  } catch (error) {
    console.error("Failed to upload image:", error);
    return null;
  }
}

/**
 * List all images for a user from Supabase storage
 */
export async function listImages(userId: string): Promise<StoredImage[]> {
  try {
    // List all files in the user's directory
    const { data, error } = await supabase.storage
      .from(`${STORAGE_BUCKET}`)
      .list(`${STORAGE_PATH}/${userId}`);

    if (error) {
      console.error("Error listing images:", error);
      throw error;
    }

    if (!data) return [];

    // Convert storage objects to StoredImage format
    return data.map((file) => {
      const filePath = `${STORAGE_PATH}/${userId}/${file.name}`;
      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

      return {
        id: `image-${file.id || file.name}`,
        src: publicUrl,
        alt: file.name.split("/").pop() || file.name,
        createdAt: file.created_at || new Date().toISOString(),
        path: filePath,
      };
    });
  } catch (error) {
    console.error("Failed to list images:", error);
    return [];
  }
}

/**
 * Delete an image from Supabase storage
 */
export async function deleteImage(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (error) {
      console.error("Error deleting image:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Failed to delete image:", error);
    return false;
  }
}
