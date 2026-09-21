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
        required:[true,"Enter your password"],
        select:false
    },

})
// userSchema.pre("save",function());
// userSchema.post("save",function());

const userModel = mongoose.model("user",userSchema)

module.exports = userModel
