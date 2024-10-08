import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    refreshToken: {
        type: String
    }
}, { timestamps: true });


userSchema.pre("save", async (next) => {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next()
})

userSchema.methods.isPasswordCorrect = async (password) => {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = async () => {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        { 
            expiresIn: "30m" 
        }
    )
}

userSchema.methods.generateRefreshToken = async () => {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { 
            expiresIn: "1d" 
        }
    )
}

export const User = mongoose.model('User', userSchema);