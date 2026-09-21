const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const JWT = require("jsonwebtoken")
const blackListModel = require("../models/blackList.model")

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
    user:{
        id:user._id,
        username:user.username,
        email:user.email
    },
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
        user:{
            id:user._id,
            username:user.username,
            email:user.email
        },
        token
    })
}
async function getMe(req,res){
    const user = await userModel.findById(req.user._id)
    return res.status(200).json({
        message:"User fetched successfully",
        user
    })
}

// logout
async function logoutUser(req,res){
    const token = req.cookies.token
    res.clearCookie("token")
    await blackListModel.create({token})
    return res.status(200).json({message:"User is logged out successfully"})
    
}


module.exports = {
    registerUser,
    loginUser,
    getMe,
    logoutUser
}