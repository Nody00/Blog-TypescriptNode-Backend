import mongoose, { SchemaType } from "mongoose";
const Schema = mongoose.Schema;

const chatSchema = new Schema({
  participants: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  messages: [
    {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  ],
});

export default mongoose.model("Chat", chatSchema);
