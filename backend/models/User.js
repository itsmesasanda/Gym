import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    goal: {
      type: String,
    },

    targetWeight: {
      type: Number,
    },

    height: {
      type: Number,
    },

    weight: {
      type: Number,
    },

    activityLevel: {
      type: String,
    },

    calories: {
      type: Number,
    },

    protein: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
