import { v2 as cloudinary } from "cloudinary";

// Cloudinary configuration

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const deleteImageonCloudinary = async (public_id) => {
  try {
    const response = await cloudinary.uploader.destroy(public_id, {
      resource_type: "image",
    });
    console.log("Cloudinary Response", response);
    return response;
  } catch (error) {
    return null;
  }
};

export { deleteImageonCloudinary };
