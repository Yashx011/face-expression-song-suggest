const mongoose = require("mongoose")

const blackListSchema = new mongoose.Schema({
    token:{
        type:String,
        required:[true,"token is required fot blacklisting"]
    }
},{
    timestamps:true
})
    

const blackListModel = mongoose.model("blackList",blackListSchema)
module.exports = blackListModel
    