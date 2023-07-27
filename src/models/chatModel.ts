import mongoose, { SchemaType } from "mongoose";
const Schema = mongoose.Schema;

const chatSchema = new Schema({
  messages: [
    {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  ],
  partisipantEmails: [
    {
      type: String,
      required: true,
    },
  ],
  partisipantUsernames: [
    {
      type: String,
      required: true,
    },
  ],
});

export default mongoose.model("Chat", chatSchema);
