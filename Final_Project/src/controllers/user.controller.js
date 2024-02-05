import { asyncHandler } from "../utils/asynHandler.js";
import ApiError from "../utils/ApiError.js";

import { User } from "../models/user.model.js";
import { application } from "express";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // we save refresh token in the db
    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: false, // to save user without validating the fields in the user model
      // when we save the user , it also need password and email but we don't have password and email
      // here so we need to validate before save false
    }); // to save user

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Access and refresh token"
    );
  }
};

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

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // check username or email
  // find the user
  // check password
  // access and  refresh token generation
  // send cookies to thee client with access and refresh token

  // req body -> data
  const { email, username, password } = req.body;

  //check username or email
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  //find the user
  const user = await User.findOne({
    $or: [{ username }, { email }], // check for username or email
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // check Password
  const isPasswordValid = await user.isPasswordCorrect(password); // user is the instance of the user model and it has a method isPasswordCorrect

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user's Credentials");
  }

  // access and  refresh token generation
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // send cookies to the client with access and refresh token
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); // loggedInUser is the user without password and refresh token

  const options = {
    httpOnly: true, // by htpOnly cookies can only be modified by the server
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          // data
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User LoggedIn Successfully"
      )
    );
});

// to log Out user
const logOutUser = asyncHandler(async (req, res) => {
  // clear cookies
  // clear refresh token

  // Now i have acces of req.user by verifyJWT middlewarw

  // clearing refresh token in database
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true, // by htpOnly cookies can only be modified by the server
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  //get refresh token from cookies
  // verify refresh token
  // get user from db
  // generate new access token
  // send new access token to the client

  // get refresh token from cookies
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request"); // 401 -> not found
  }

  try {
    //verify the refresh token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // decodedToken has access of ._id , because when we crreated the refresh token we only added _id in the payload

    // get user from db
    const user = await User.findById(decodedToken?._id);

    // check user
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    // check token of User and incoming token
    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, " Refresh Token is expired or Used");
    }

    // generate new Access Token

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    // send response and save in the cookies

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});
export { registerUser, loginUser, logOutUser, refreshAccessToken };
