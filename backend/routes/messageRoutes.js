const express = require("express");
const { sendMessage, getMessages } = require("../controllers/messageController.js");
const { protect } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.use(protect)

// POST /api/messages
router.post("/", sendMessage);

// GET /api/messages/:receiverId
router.get("/:receiverId", getMessages);

module.exports = router;
