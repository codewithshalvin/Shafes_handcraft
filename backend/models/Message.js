const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  body: { type: String, required: true, maxlength: 4000 },
  // optional fields:
  attachments: [{ url: String, name: String, size: Number }]
}, { timestamps: true });

messageSchema.index({ conversation: 1, createdAt: 1 });
module.exports = mongoose.model("Message", messageSchema);