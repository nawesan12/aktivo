// Read as literals on purpose: these are the only two variables also needed in
// client components, and Next only inlines `process.env.NEXT_PUBLIC_*` when it
// appears verbatim. Everything server-side goes through `@/lib/env`.
export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "jiku",
};

/**
 * Get the Cloudinary upload URL for a business image.
 * Organizes by business slug for easy management.
 */
export function getUploadFolder(businessSlug: string, type: "services" | "staff" | "business" = "business") {
  return `jiku/${businessSlug}/${type}`;
}
