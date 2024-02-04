import { asyncHandler } from "../utils/asynHandler.js";
import ApiError from "../utils/ApiError.js";

import { User } from "../models/user.model.js";
import { application } from "express";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validation - check whether username is empty or not and password is empty or not and email is empty or not
  //check if user already exists : username or email
  // check for images , check for avatar
  // upload them to cloudinary
  // check avatar on cloudinary

  // create user object - create entry in db
  // remove password and refresh token from response
  //check for user creation -> return response  or return error

  const { fullName, email, username, password } = req.body;
  console.log("email", email);

  //validation - check whether username is empty or not and password is empty or not and email is empty or not
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //check if user already exists : username or email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with eamil or username  already Exists");
  }

  // check for images , check for avatar
  const avatarLoacalPath = req.files?.avatar[0]?.path; // to get the path of the avatar file
  //const coverImageLoacalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  console.log(req.files);

  if (!avatarLoacalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // Upload them to cloudinary
  const avatar = await uploadOnCloudinary(avatarLoacalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw ApiError(400, "AVatar file is required");
  }

  // create user object - create entry in db
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // check whether user is created or not , remove password and refresh token from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw ApiError(500, "Something went wrong while registering the user");
  }

  //return response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

export { registerUser };
