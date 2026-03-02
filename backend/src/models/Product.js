const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sector: {
      type: String,
      required: true,
      enum: ["Expediente", "Escritorio", "Limpeza", "Copa"]
    },
    unit: {
      type: String,
      required: true,
      enum: ["Un", "Pct", "Ltr", "Cx"],
      default: "Un"
    },
    minQty: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 0, default: 0 }
  },
  { timestamps: true }
);

// Evita duplicar o mesmo produto dentro do mesmo setor
ProductSchema.index({ name: 1, sector: 1 }, { unique: true });

ProductSchema.virtual("needsRestock").get(function () {
  return this.qty <= this.minQty;
});

ProductSchema.set("toJSON", { virtuals: true });
ProductSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Product", ProductSchema);
