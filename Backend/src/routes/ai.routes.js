const { Router } = require("express");
const aiController = require("../controllers/ai.controller");
const { authUser } = require("../middleware/auth.middleware");

const router = Router();

// Protected AI playlist generation endpoints
router.post("/generate-playlist", authUser, aiController.generatePlaylist);
router.post("/playlist", authUser, aiController.generatePlaylist);

module.exports = router;
