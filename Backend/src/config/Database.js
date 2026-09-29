const mongoose = require("mongoose");

const connectToDb = async () => {
     await mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            console.log("db is connected")
        })
        .catch((err) => {
            console.log(err)
        })
}

module.exports = connectToDb