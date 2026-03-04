export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "aktivo",
};

/**
 * Get the Cloudinary upload URL for a business image.
 * Organizes by business slug for easy management.
 */
export function getUploadFolder(businessSlug: string, type: "services" | "staff" | "business" = "business") {
  return `aktivo/${businessSlug}/${type}`;
}
