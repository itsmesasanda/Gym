import mongoose from "mongoose";

const BodyMeasurementSchema = new mongoose.Schema(
  {
    date:    { type: String, required: true },   // MM-DD format
    weight:  { type: Number, required: true },   // kg
    bodyFat: { type: Number, default: 0 },       // % (manually entered)
    waist:   { type: Number, required: true },   // cm
  },
  { timestamps: true }
);

BodyMeasurementSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
  },
});

const BodyMeasurement = mongoose.model("BodyMeasurement", BodyMeasurementSchema);

export default BodyMeasurement;
