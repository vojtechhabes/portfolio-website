const mongoose = require("mongoose");

const project = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    content: {
      type: String,
    },
    starred: {
      type: Boolean,
      required: true,
      default: false,
    },
    published: {
      type: Boolean,
      required: true,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    image: {
      type: Buffer,
    },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", project);

module.exports = Project;
