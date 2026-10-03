const {Router} = require("express");
const authController = require("../controllers/auth.controller");
const { authUser: authMiddleware } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

const router = Router();

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/google", authController.googleLogin);
router.get("/get-me", authMiddleware, authController.getMe);
router.patch("/profile", authMiddleware, authController.updateProfile);
router.patch("/profile/photo", authMiddleware, upload.single("profilePicture"), authController.updateProfilePhoto);
router.post("/logout", authMiddleware, authController.logoutUser);

module.exports = router;


