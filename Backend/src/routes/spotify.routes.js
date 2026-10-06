const { Router } = require("express");
const spotifyController = require("../controllers/spotify.controller");

const router = Router();

router.get("/search", spotifyController.searchSpotify);

module.exports = router;
