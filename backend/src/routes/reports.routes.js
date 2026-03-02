const express = require("express");
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");

const Product = require("../models/Product");
const Entry = require("../models/Entry");
const Exit = require("../models/Exit");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

function parseDateOnly(dateStr) {
  if (typeof dateStr !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
}

function getUtcRangeFromDateStrings(startDate, endDate) {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (!start || !end) return null;

  return {
    $gte: new Date(Date.UTC(start.year, start.month - 1, start.day, 0, 0, 0, 0)),
    $lte: new Date(Date.UTC(end.year, end.month - 1, end.day, 23, 59, 59, 999))
  };
}

function getDateFilterFromQuery(req, res) {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) return {};

  const dateRange = getUtcRangeFromDateStrings(startDate, endDate);
  if (!dateRange) {
    res.status(400).json({ error: "startDate/endDate invalidas. Use YYYY-MM-DD" });
    return null;
  }

  return { date: dateRange };
}

function formatDateBR(date) {
  return new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

/**
 * ADMIN ONLY
 * (Opcional) ?sector=Limpeza
 */
router.get("/stock.csv", requireAuth, requireAdmin, async (req, res) => {
  const { sector } = req.query;
  const filter = sector ? { sector } : {};

  const products = await Product.find(filter).sort({ sector: 1, name: 1 }).lean();
  const rows = products.map((p) => ({
    sector: p.sector,
    name: p.name,
    unit: p.unit,
    qty: p.qty,
    minQty: p.minQty,
    needsRestock: p.qty <= p.minQty ? "SIM" : "NAO"
  }));

  const parser = new Parser({ fields: ["sector", "name", "unit", "qty", "minQty", "needsRestock"] });
  const csv = parser.parse(rows);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="estoque.csv"');
  res.send(csv);
});

router.get("/stock.pdf", requireAuth, requireAdmin, async (req, res) => {
  const { sector } = req.query;
  const filter = sector ? { sector } : {};

  const products = await Product.find(filter).sort({ sector: 1, name: 1 }).lean();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="estoque.pdf"');

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  doc.fontSize(16).text("Relatorio de Estoque", { align: "center" });
  doc.moveDown();

  let currentSector = null;
  doc.fontSize(11);

  products.forEach((p) => {
    if (p.sector !== currentSector) {
      currentSector = p.sector;
      doc.moveDown(0.5);
      doc.fontSize(13).text(`Categoria: ${currentSector}`);
      doc.fontSize(11);
    }
    const alert = p.qty <= p.minQty ? "REPOR" : "OK";
    doc.text(`${p.name} (${p.unit}) | Qtd: ${p.qty} | Min: ${p.minQty} | ${alert}`);
  });

  doc.end();
});

router.get("/entries.pdf", requireAuth, requireAdmin, async (req, res) => {
  const filter = getDateFilterFromQuery(req, res);
  if (filter === null) return;

  const entries = await Entry.find(filter).populate("product").sort({ date: -1 }).lean();
  const { startDate, endDate } = req.query;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="entradas.pdf"');

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  doc.fontSize(16).text("Relatorio de Entradas", { align: "center" });
  if (startDate && endDate) {
    doc.fontSize(10).text(`Periodo: ${formatDateBR(startDate)} a ${formatDateBR(endDate)}`, { align: "center" });
  }
  doc.moveDown(0.5);

  const col1 = 50, col2 = 120, col3 = 240, col4 = 360, col5 = 440;
  doc.fontSize(10).font("Helvetica-Bold");
  doc.text("Data", col1, doc.y, { width: col2 - col1 });
  doc.text("Categoria", col2, doc.y - 14, { width: col3 - col2 });
  doc.text("Produto", col3, doc.y - 14, { width: col4 - col3 });
  doc.text("Unidade", col4, doc.y - 14, { width: col5 - col4 });
  doc.text("Quantidade", col5, doc.y - 14);
  doc.moveTo(50, doc.y + 2).lineTo(550, doc.y + 2).stroke();
  doc.moveDown();

  doc.font("Helvetica");
  entries.forEach((e) => {
    const date = formatDateBR(e.date);
    const sector = e.product?.sector || "-";
    const product = e.product?.name || "-";
    const qty = e.qty.toString();
    const unit = e.product?.unit || "-";

    doc.text(date, col1, doc.y, { width: col2 - col1 });
    doc.text(sector, col2, doc.y - 14, { width: col3 - col2 });
    doc.text(product, col3, doc.y - 14, { width: col4 - col3 });
    doc.text(unit, col4, doc.y - 14, { width: col5 - col4 });
    doc.text(qty, col5, doc.y - 14);
    doc.moveDown();
  });

  doc.end();
});

router.get("/exits.pdf", requireAuth, requireAdmin, async (req, res) => {
  const filter = getDateFilterFromQuery(req, res);
  if (filter === null) return;

  const exits = await Exit.find(filter).populate("product").sort({ date: -1 }).lean();
  const { startDate, endDate } = req.query;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="saidas.pdf"');

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  doc.fontSize(16).text("Relatorio de Saidas", { align: "center" });
  if (startDate && endDate) {
    doc.fontSize(10).text(`Periodo: ${formatDateBR(startDate)} a ${formatDateBR(endDate)}`, { align: "center" });
  }
  doc.moveDown(0.5);

  const col1 = 35, col2 = 95, col3 = 165, col4 = 250, col5 = 305, col6 = 360, col7 = 430;
  doc.fontSize(10).font("Helvetica-Bold");
  doc.text("Data", col1, doc.y, { width: col2 - col1 });
  doc.text("Categoria", col2, doc.y - 14, { width: col3 - col2 });
  doc.text("Produto", col3, doc.y - 14, { width: col4 - col3 });
  doc.text("Unidade", col4, doc.y - 14, { width: col5 - col4 });
  doc.text("Quantidade", col5, doc.y - 14, { width: col6 - col5 });
  doc.text("Retirado por", col6, doc.y - 14, { width: col7 - col6 });
  doc.text("Observacao", col7, doc.y - 14);
  doc.moveTo(35, doc.y + 2).lineTo(560, doc.y + 2).stroke();
  doc.moveDown();

  doc.font("Helvetica");
  exits.forEach((e) => {
    const date = formatDateBR(e.date);
    const sector = e.product?.sector || "-";
    const product = e.product?.name || "-";
    const qty = e.qty.toString();
    const unit = e.product?.unit || "-";
    const takenBy = e.takenBy || "-";
    const observation = e.observation || "-";

    doc.text(date, col1, doc.y, { width: col2 - col1 });
    doc.text(sector, col2, doc.y - 14, { width: col3 - col2 });
    doc.text(product, col3, doc.y - 14, { width: col4 - col3 });
    doc.text(unit, col4, doc.y - 14, { width: col5 - col4 });
    doc.text(qty, col5, doc.y - 14, { width: col6 - col5 });
    doc.text(takenBy, col6, doc.y - 14, { width: col7 - col6 });
    doc.text(observation, col7, doc.y - 14);
    doc.moveDown();
  });

  doc.end();
});

router.get("/entries.csv", requireAuth, requireAdmin, async (req, res) => {
  const filter = getDateFilterFromQuery(req, res);
  if (filter === null) return;

  const entries = await Entry.find(filter).populate("product").sort({ date: -1 }).lean();
  const rows = entries.map((e) => ({
    date: new Date(e.date).toISOString().slice(0, 10),
    sector: e.product?.sector || "",
    product: e.product?.name || "",
    unit: e.product?.unit || "",
    qty: e.qty
  }));

  const parser = new Parser({ fields: ["date", "sector", "product", "unit", "qty"] });
  const csv = parser.parse(rows);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="entradas.csv"');
  res.send(csv);
});

router.get("/exits.csv", requireAuth, requireAdmin, async (req, res) => {
  const filter = getDateFilterFromQuery(req, res);
  if (filter === null) return;

  const exits = await Exit.find(filter).populate("product").sort({ date: -1 }).lean();
  const rows = exits.map((e) => ({
    date: new Date(e.date).toISOString().slice(0, 10),
    sector: e.product?.sector || "",
    product: e.product?.name || "",
    unit: e.product?.unit || "",
    qty: e.qty,
    takenBy: e.takenBy,
    observation: e.observation || ""
  }));

  const parser = new Parser({ fields: ["date", "sector", "product", "unit", "qty", "takenBy", "observation"] });
  const csv = parser.parse(rows);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="saidas.csv"');
  res.send(csv);
});

module.exports = router;
