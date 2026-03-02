const mongoose = require("mongoose");

const ExitSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    qty: { type: Number, required: true, min: 1 },
    takenBy: { type: String, required: true, trim: true },
    observation: { type: String, trim: true, default: "" },
    date: { type: Date, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exit", ExitSchema);
