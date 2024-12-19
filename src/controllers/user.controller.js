import { User } from "../models/user.model.js"
import { sendError as ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId, res) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken

        await user.save({validateBeforeSave: false})

        return { accessToken, refreshToken }

    } catch (error) {
        return ApiError(res, 500, "Error while generating access and refresh token", error.message)
    }
}

const options = {
    httpOnly: true,
    secure: true,
}

const registerUser = asyncHandler( async (req, res) => {
    const { fullName, email, password, username } = req.body

    if ([fullName, email, password, username].some(field => field?.trim() === "")) {
        return ApiError(res, 400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        return ApiError(res, 409, "User with username or email already exists")
    }

    const user = await User.create({
        fullName,
        email,
        password,
        username: username?.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        return ApiError(res, 500, "Server error! Failed to register user")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body

    if (!(email || username)) {
        return ApiError(res, 400, "Email or username is required")
    }

    const user = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (!user) {
        return ApiError(res, 404, "User not found!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        return ApiError(res, 401, "Invalid password!")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id, res)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true,
        }
    )

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            {},
            "User logged out successfully"
        )
    )
})

const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        return ApiError(res, 401, "Unauthorized Request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            return ApiError(res, 401, "Invalid Refresh Token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            return ApiError(res, 401, "Refresh Token invalid or expired")
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken: newRefreshToken
                },
                "Access Token refreshed successfully"
            )
        )
    } catch (error) {
        return ApiError(res, 401, error?.message || "Invalid refresh Token")
    }
})

const changeCurrentPassword = asyncHandler( async (req, res) => {
    const { currentPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword)

    if (!isPasswordCorrect) {
        return ApiError(res, 400, "Invalid current password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
   .status(200)
   .json(
    new ApiResponse(
        200,
        {},
        "Password changed successfully"
    )
   )
})

const getCurrentUser = asyncHandler( async(req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "User fetched successfully"
        )
    )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        return ApiError(res, 400, "Full Name and Email are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            fullName,
            email: email.toLowerCase()
        },
        {
            new: true,
        }
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json( new ApiResponse(200, user, "Account details updated Successfully!"))
})

const deleteUser = asyncHandler(async (req, res) => {
    await User.findByIdAndDelete(req.user._id)

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            {},
            "User deleted successfully"
        )
    )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    generateAccessAndRefreshTokens,
    deleteUser
}