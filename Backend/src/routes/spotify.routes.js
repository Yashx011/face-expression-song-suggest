const { Router } = require("express");
const spotifyController = require("../controllers/spotify.controller");

const router = Router();

router.get("/search", spotifyController.searchSpotify);
router.post("/recommend-next", spotifyController.getRecommendedNextTracks);

module.exports = router;
