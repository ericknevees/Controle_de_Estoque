const express = require("express");
const Exit = require("../models/Exit");
const Product = require("../models/Product");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function parseDateOnly(dateStr) {
  if (typeof dateStr !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

// Listar saidas (autenticado)
router.get("/", requireAuth, async (req, res) => {
  const exits = await Exit.find().populate("product").sort({ date: -1, createdAt: -1 });
  res.json(exits);
});

// Criar saida (subtrai estoque)
router.post("/", requireAuth, async (req, res) => {
  const { productId, qty, date, observation } = req.body;
  if (!productId || !qty || !date) {
    return res.status(400).json({ error: "productId, qty, date obrigatorios" });
  }

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ error: "Produto nao encontrado" });

  const q = Number(qty);
  if (q < 1) return res.status(400).json({ error: "qty deve ser >= 1" });
  if (product.qty < q) return res.status(400).json({ error: `Estoque insuficiente. Disponivel: ${product.qty}` });

  product.qty -= q;
  await product.save();

  const parsedDate = parseDateOnly(date);
  if (!parsedDate) return res.status(400).json({ error: "date invalida. Use YYYY-MM-DD" });

  const takenBy = req.user?.username;
  if (!takenBy) return res.status(401).json({ error: "Usuario nao autenticado" });

  const exit = await Exit.create({
    product: product._id,
    qty: q,
    takenBy,
    observation: typeof observation === "string" ? observation.trim() : "",
    date: parsedDate
  });

  const populated = await Exit.findById(exit._id).populate("product");
  res.status(201).json({ exit: populated, product });
});

module.exports = router;
