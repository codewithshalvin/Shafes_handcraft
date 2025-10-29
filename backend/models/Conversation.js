// models/Conversation.js
const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  // two-party chat: user and admin
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  lastMessageAt: { type: Date, default: Date.now, index: true },
  userUnread: { type: Number, default: 0 },
  adminUnread: { type: Number, default: 0 }
}, { timestamps: true });

conversationSchema.index({ user: 1, admin: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", conversationSchema);


