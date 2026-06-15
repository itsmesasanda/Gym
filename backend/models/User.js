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

    // Optional: admin-created (front-desk) members have no password until they
    // claim app access by registering with the same email.
    password: {
      type: String,
    },

    // How the account was created: "app" = self-registered, "admin" = added by
    // a gym admin at the front desk (record-only until claimed).
    source: {
      type: String,
      enum: ["app", "admin"],
      default: "app",
    },

    // ── Contact & personal ──────────────────────────────────────────────────
    phone: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
      default: "",
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    emergencyContactName: {
      type: String,
      default: "",
    },
    emergencyContactPhone: {
      type: String,
      default: "",
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

    // ── Multi-tenancy & membership (Phase 2 admin) ──────────────────────────
    // Which gym this member belongs to. Set on registration via gym code.
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      default: null,
      index: true,
    },
    // Lifecycle: pending → (admin approves) → active; admin may lock/reject.
    status: {
      type: String,
      enum: ["pending", "active", "locked", "rejected"],
      default: "active",
      index: true,
    },
    // Stable QR check-in token (lazily generated). Encoded into the member's QR
    // so the gym scanner can identify them. Stable so a shared/printed QR image
    // (e.g. sent over WhatsApp) keeps working.
    checkinToken: {
      type: String,
      default: null,
      index: true,
    },

    // Assigned trainer (managed by the gym admin). A member has at most one.
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trainer",
      default: null,
      index: true,
    },
    membershipPlan: {
      type: String,
      default: "",
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "overdue", "none"],
      default: "none",
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    nextPaymentDate: {
      type: Date,
      default: null,
    },

    // Password reset: bcrypt hash of the emailed 6-digit code + its expiry.
    resetCodeHash: {
      type: String,
    },
    resetCodeExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  // Record-only members (admin-created, not yet claimed) have no password and
  // can never match — they must claim the account in-app first.
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
