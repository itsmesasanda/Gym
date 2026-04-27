import mongoose from "mongoose";
import { isValidThumbnailUrl, isValidYouTubeUrl } from "../utils/videoValidation.js";

const VideoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: "General",
      trim: true,
    },
    thumbnail: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: isValidThumbnailUrl,
        message: "Thumbnail must be a YouTube URL or a direct image URL",
      },
    },
    youtubeUrl: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isValidYouTubeUrl,
        message: "YouTube URL must be a valid YouTube video URL",
      },
    },
  },
  { timestamps: true }
);

const Video = mongoose.model("Video", VideoSchema);

export default Video;
