import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  role:    { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
}, { timestamps: true });

const CoachConversationSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  messages:  { type: [MessageSchema], default: [] },
}, { timestamps: true });

const CoachConversation = mongoose.model("CoachConversation", CoachConversationSchema);

export default CoachConversation;
