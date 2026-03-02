const express = require("express");
const Entry = require("../models/Entry");
const Product = require("../models/Product");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

function parseDateOnly(dateStr) {
  if (typeof dateStr !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

// Admin: listar entradas
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  const entries = await Entry.find().populate("product").sort({ date: -1, createdAt: -1 });
  res.json(entries);
});

// Admin: criar entrada (soma estoque)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { productId, qty, date } = req.body;
  if (!productId || !qty || !date) return res.status(400).json({ error: "productId, qty, date obrigatórios" });

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ error: "Produto não encontrado" });

  const q = Number(qty);
  if (q < 1) return res.status(400).json({ error: "qty deve ser >= 1" });

  product.qty += q;
  await product.save();

  const parsedDate = parseDateOnly(date);
  if (!parsedDate) return res.status(400).json({ error: "date invalida. Use YYYY-MM-DD" });

  const entry = await Entry.create({ product: product._id, qty: q, date: parsedDate });
  const populated = await Entry.findById(entry._id).populate("product");
  res.status(201).json({ entry: populated, product });
});

module.exports = router;
