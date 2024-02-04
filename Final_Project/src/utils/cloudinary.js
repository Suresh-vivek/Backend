import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; // Node.js File system for reading files

// Cloudinary configuration

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null; // error message can be returned in place of null
    //upload file on cloudinary

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //file has been uploaded successfully
    //console.log("File uploaded successfully on Cloudinary", response.url);
    fs.unlinkSync(localFilePath);
    console.log("Cloudinary Response", response);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // Remove the locally saved temp file as the upload operation got failed
    return null;
  }
};

export { uploadOnCloudinary };
