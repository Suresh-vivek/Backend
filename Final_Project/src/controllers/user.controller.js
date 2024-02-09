import { asyncHandler } from "../utils/asynHandler.js";
import ApiError from "../utils/ApiError.js";

import { User } from "../models/user.model.js";
import { application } from "express";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

import { deleteImageonCloudinary } from "../utils/deleteImageonCloudinary.js";
import mongoose from "mongoose";

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

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  // we can take newPassword as well as confirmNewPassword and then we can compare both of them

  // we are using auth middle hence req has req.user

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid Password");
  }

  user.password = newPassword; // before saving the password save hook will runn and encrypt the password
  await user.save({
    validateBeforeSave: false,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  // we are using auth middle hence req has req.user

  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User Fetched Successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details Updated Successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // here we use multer middleware and get req.files
  const avatarLoacalPath = req.file?.path;
  const oldImageUrl = req.user?.avatar.public_id;

  if (!avatarLoacalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLoacalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  // update avatar in the db
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  deleteImageonCloudinary(oldImageUrl);

  // we can also delete the avatar from the cloudinary
  // we can use cloudinary.uploader.destroy(public_id, options, callback) to delete the image from cloudinary

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated Successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  // here we use multer middleware and get req.files
  const coverImageLoacalPath = req.file?.path;

  if (!coverImageLoacalPath) {
    throw new ApiError(400, "Cover Image file is required");
  }

  const coverImage = await uploadOnCloudinary(coverImageLoacalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading coverImage");
  }

  // update avatar in the db
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { mew: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated Successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "User name is missing");
  }
  // username is the usernam of the channel
  // we need to get the channel details and the number of subscribers

  // User.findOne({username})
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, " Channel Not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User Channel fetched Successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",

              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch History Fetched Successfully"
      )
    );
});
export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
