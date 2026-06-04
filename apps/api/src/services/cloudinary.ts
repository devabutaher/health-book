import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
  api_key: process.env["CLOUDINARY_API_KEY"],
  api_secret: process.env["CLOUDINARY_API_SECRET"],
});

export async function uploadImage(filePath: string, folder: string): Promise<string> {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: `healthbook/${folder}`,
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });
  return result.secure_url;
}

export async function uploadVideo(
  filePath: string,
  folder: string,
): Promise<{ url: string; thumbnailUrl?: string }> {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: `healthbook/${folder}`,
    resource_type: "video",
    eager: [
      { width: 720, height: 1280, crop: "pad", quality: "auto", fetch_format: "auto" },
      { width: 360, height: 640, crop: "pad", quality: "auto", fetch_format: "jpg" },
    ],
    eager_async: true,
  });
  return {
    url: result.secure_url,
    thumbnailUrl: result.eager?.[1]?.secure_url,
  };
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export async function deleteVideo(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
}
