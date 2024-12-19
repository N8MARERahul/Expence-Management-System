import { Router } from "express";
import { changeCurrentPassword, deleteUser, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()
router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/delete-account").delete(verifyJWT, deleteUser)

export default router;