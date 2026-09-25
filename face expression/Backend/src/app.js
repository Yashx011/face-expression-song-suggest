const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const cors = require("cors")
const songRouter = require("./routes/song.routes")


app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}))

/* Routes */
const authRoutes = require("./routes/auth.routes")
app.use("/api/auth",authRoutes)
app.use("/api/song",songRouter)



module.exports = app