import { Router } from "express";
import {
  logOutUser,
  loginUser,
  registerUser,
  refreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 3,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logOutUser); // verifyJWT is a middleware to verify the jwt token
// we can add as many middleware we want to add in the route

router.route("/refresh-token").post(refreshAccessToken);

// change password
router.route("/change-password").post(verifyJWT, changeCurrentUserPassword);

// get current user
router.route("/current-user").get(verifyJWT, getCurrentUser);

//Update account details
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

// avataR DETAILS
router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

// User cover Image
router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

// get user Profile
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);

// get Watch History

router.route("/history").get(verifyJWT, getWatchHistory);

export default router;
