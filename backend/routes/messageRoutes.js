const express = require("express");
const { sendMessage, getMessages, uploadAttachment } = require("../controllers/messageController.js");
const { protect } = require("../middleware/authMiddleware.js");
const attachmentUpload = require("../middleware/uploadAttachment.js")

const router = express.Router();

router.use(protect)

// POST /api/messages
router.post("/", sendMessage);

// POST /api/messages/upload
router.post("/upload", attachmentUpload.single("file"), uploadAttachment);

// GET /api/messages/:receiverId
router.get("/:receiverId", getMessages);

module.exports = router;
