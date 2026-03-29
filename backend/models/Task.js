const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    duration: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
