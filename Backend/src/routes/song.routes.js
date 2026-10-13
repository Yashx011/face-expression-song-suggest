const express = require("express");
const router = express.Router();
const songController = require("../controllers/song.controller");
const { authUser } = require("../middleware/auth.middleware");

// Interaction endpoints (Protected)
router.post("/like/:songId", authUser, songController.toggleLike);
router.post("/dislike/:songId", authUser, songController.toggleDislike);
router.post("/save/:songId", authUser, songController.toggleSave);
router.get("/status/:songId", authUser, songController.getInteractionStatus);
router.get("/liked", authUser, songController.getLikedSongs);
router.get("/saved", authUser, songController.getSavedSongs);

// History endpoints (Protected)
router.post("/history", authUser, songController.recordHistory);
router.get("/history", authUser, songController.getHistory);

// Analytics & Preferences endpoints (Protected)
router.get("/analytics", authUser, songController.getAnalytics);
router.get("/preferences", authUser, songController.getUserPreferences);

module.exports = router;