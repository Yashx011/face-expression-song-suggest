const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({
    username :{
        type:String,
        
    },
    email:{
        type:String,
        required:[true,"Enter your email"]
    },
    password:{
        type:String,
        required: function() {
            return this.authProvider === 'local';
        },
        select:false
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    profilePicture: {
        type: String
    },
    googleProfilePicture: {
        type: String
    },
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local"
    }

})
// userSchema.pre("save",function());
// userSchema.post("save",function());

const userModel = mongoose.model("user",userSchema)

module.exports = userModel
