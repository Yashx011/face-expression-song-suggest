const { Router } = require("express");
const youtubeController = require("../controllers/youtube.controller");

const router = Router();

router.get("/search", youtubeController.searchYouTube);

module.exports = router;
