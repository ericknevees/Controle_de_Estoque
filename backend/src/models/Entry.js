const mongoose = require("mongoose");

const EntrySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    qty: { type: Number, required: true, min: 1 },
    date: { type: Date, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Entry", EntrySchema);
