const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const JWT = require("jsonwebtoken")
const blackListModel = require("../models/blackList.model")
const redis = require("../config/cache")
const { verifyGoogleToken } = require("../services/google.service")
const storageService = require("../services/storage.service")

function formatUserResponse(user) {
    if (!user) return null;
    const effectiveProfilePicture = user.profilePicture || user.googleProfilePicture || null;
    return {
        id: user._id,
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: effectiveProfilePicture,
        customProfilePicture: user.profilePicture || null,
        googleProfilePicture: user.googleProfilePicture || null,
        authProvider: user.authProvider
    };
}

async function registerUser(req,res){
    const {username,email,password} = req.body

const isAlredyRegister = await userModel.findOne({
    $or:[
        {email},
        {username}
    ]
})

if(isAlredyRegister){
    return res.status(400).json({message:"User already registered"})
}

const hashedPassword = await bcrypt.hash(password,10)

const user = await userModel.create({
    username,
    email,
    password:hashedPassword
})

const token = JWT.sign({_id:user._id, username:user.username,email:user.email},process.env.JWT_SECRET,{expiresIn:"3d"}
)


return res.status(201).json({
    message:"user created successfully",
    user: formatUserResponse(user),
    token
})}


// login
async function loginUser(req,res){
    
    const {username,email,password} = req.body

    const user = await userModel.findOne({$or:[{email},{username}]}).select("+password")
    if(!user){
        return res.status(400).json({message:"Invalid Credential"})
    }
    const isPasswordValid = await bcrypt.compare(password,user.password)
    if(!isPasswordValid){
        return res.status(400).json({message:"invalid password"})
    }
    const token = JWT.sign({_id:user._id, username:user.username,email:user.email},process.env.JWT_SECRET,{expiresIn:"3d"})
    res.cookie("token",token)
    return res.status(200).json({
        message:"User is logged in successfully",
        user: formatUserResponse(user),
        token
    })
}

// google login
async function googleLogin(req, res) {
    const { idToken, token: bodyToken } = req.body
    const token = idToken || bodyToken

    if (!token) {
        return res.status(400).json({ message: "Token is required" })
    }

    let payload
    try {
        payload = await verifyGoogleToken(token)
    } catch (error) {
        return res.status(401).json({ message: "Invalid Google token" })
    }

    if (!payload.email_verified) {
        return res.status(401).json({ message: "Google email is not verified" })
    }

    const { sub, email, name, picture } = payload

    let user = await userModel.findOne({
        $or: [
            { googleId: sub },
            { email: email }
        ]
    })

    if (!user) {
        user = await userModel.create({
            username: name || email.split("@")[0],
            email: email,
            googleId: sub,
            googleProfilePicture: picture,
            authProvider: "google"
        })
    } else {
        user.googleId = user.googleId || sub
        user.googleProfilePicture = picture
        if (user.profilePicture && user.profilePicture.includes("googleusercontent.com")) {
            user.profilePicture = undefined
        }
        user.authProvider = "google"
        await user.save()
    }

    const tokenJwt = JWT.sign(
        { _id: user._id, username: user.username, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "3d" }
    )

    res.cookie("token", tokenJwt)

    return res.status(200).json({
        message: "User is logged in successfully",
        user: formatUserResponse(user),
        token: tokenJwt
    })
}

async function getMe(req,res){
    const user = await userModel.findById(req.user._id)
    return res.status(200).json({
        message:"User fetched successfully",
        user: formatUserResponse(user)
    })
}

// logout
async function logoutUser(req,res){
    const token = req.cookies.token
    res.clearCookie("token")
    await redis.set(token, Date.now(), "EX", 60 * 60 * 24 * 7);
    return res.status(200).json({message:"User is logged out successfully"})
    
}


async function updateProfile(req, res) {
    const { username, profilePicture } = req.body

    if (username !== undefined) {
        if (typeof username !== "string" || username.trim() === "") {
            return res.status(400).json({ message: "Username cannot be empty" })
        }
    }

    const updateFields = {}
    if (username !== undefined) {
        updateFields.username = username.trim()
    }
    if (profilePicture !== undefined) {
        updateFields.profilePicture = profilePicture
    }

    const updatedUser = await userModel.findByIdAndUpdate(
        req.user._id,
        { $set: updateFields },
        { new: true }
    )

    if (!updatedUser) {
        return res.status(404).json({ message: "User not found" })
    }

    return res.status(200).json({
        message: "Profile updated successfully",
        user: formatUserResponse(updatedUser)
    })
}


async function updateProfilePhoto(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided" })
        }

        const file = await storageService.uploadFile({
            buffer: req.file.buffer,
            filename: `${req.user._id}-${Date.now()}-${req.file.originalname || "profile.jpg"}`,
            folder: "profile-pictures"
        })

        const updatedUser = await userModel.findByIdAndUpdate(
            req.user._id,
            { $set: { profilePicture: file.url } },
            { new: true }
        )

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" })
        }

        return res.status(200).json({
            message: "Profile photo updated successfully",
            user: formatUserResponse(updatedUser)
        })
    } catch (error) {
        return res.status(500).json({ message: error.message || "Failed to upload profile photo" })
    }
}


module.exports = {
    registerUser,
    loginUser,
    googleLogin,
    getMe,
    logoutUser,
    updateProfile,
    updateProfilePhoto
}