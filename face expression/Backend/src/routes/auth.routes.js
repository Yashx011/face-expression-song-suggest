const {Router} = require("express");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware")

const router = Router()

router.post("/register",authController.registerUser)
router.post("/login",authController.loginUser)
router.get("/get-me" , authMiddleware,authController.getMe)
router.get("/logout",authMiddleware,authController.logoutUser)

module.exports = router

