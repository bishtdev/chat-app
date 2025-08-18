const express = require("express");
const { registerUser, loginUser, getAllUsers, getChattedUsers, getProfile, updateProfile, uploadAvatar } = require("../controllers/userController.js");
const { protect } = require("../middleware/authMiddleware.js");
const upload = require("../middleware/uploadAvatar.js")

const router = express.Router();

// POST /api/users/register
router.post("/register", registerUser);

// POST /api/users/login
router.post("/login", loginUser);

// GET /api/users?search=username
router.get("/",protect, getAllUsers);

router.get("/chatted", protect, getChattedUsers);

//user Profile Routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.post("/profile/avatar", protect, upload.single("avatar"), uploadAvatar);

module.exports = router;
