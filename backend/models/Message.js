const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  message: { type: String },
  timestamp: { type: Date, default: Date.now },
  isRead:{type: Boolean, default: false},
  attachmentUrl: {type: String, default: null},
  attachmentType: {type: String, default: null},
  attachmentName: {type: String, default: null},
  attachmentSize: {type: String, default: null}
});

module.exports = mongoose.model("Message", MessageSchema);
