const express = require("express");
const Product = require("../models/Product");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// TODOS autenticados podem listar (usuário precisa ver estoque)
router.get("/", requireAuth, async (req, res) => {
  const { sector } = req.query; // opcional: ?sector=Limpeza
  const filter = sector ? { sector } : {};
  const products = await Product.find(filter).sort({ sector: 1, name: 1 });
  res.json(products);
});

// ADMIN cria
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, sector, unit, minQty, qty } = req.body;
  if (!name || !sector || minQty == null || !unit) {
    return res.status(400).json({ error: "name, sector, unit, minQty obrigatórios" });
  }

  const created = await Product.create({
    name,
    sector,
    unit,
    minQty: Number(minQty),
    qty: qty != null ? Number(qty) : 0
  });

  res.status(201).json(created);
});

// ADMIN atualiza
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const patch = {};
  ["name", "sector", "unit", "minQty", "qty"].forEach((k) => {
    if (req.body[k] != null) {
      patch[k] = k === "name" || k === "sector" || k === "unit" ? req.body[k] : Number(req.body[k]);
    }
  });

  const updated = await Product.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true });
  if (!updated) return res.status(404).json({ error: "Produto não encontrado" });
  res.json(updated);
});

// ADMIN remove
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const deleted = await Product.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Produto não encontrado" });
  res.status(204).send();
});

module.exports = router;
