import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Scheema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId, // one who is subscribing
      ref: "User",
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId, // channel is also a user 
      ref: "User", // one to whom subscriber is subscribing 
    },
  },
  { timestamps: true }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);
