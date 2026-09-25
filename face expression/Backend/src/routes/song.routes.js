const express = require("express")
const router = express.Router()
const upload = require("../middleware/upload.middleware")
const songController = require("../controllers/song.controller")


router.post("/",upload.single("song"),songController.uploadSong)
router.get("/",songController.getSong)
    
module.exports = router;