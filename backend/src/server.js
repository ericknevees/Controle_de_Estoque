require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db");

const authRoutes = require("./routes/auth.routes");
const productsRoutes = require("./routes/products.routes");
const entriesRoutes = require("./routes/entries.routes");
const exitsRoutes = require("./routes/exits.routes");
const reportsRoutes = require("./routes/reports.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/entries", entriesRoutes);
app.use("/api/exits", exitsRoutes);
app.use("/api/reports", reportsRoutes);

app.use((err, req, res, next) => {
  console.error("❌ Erro:", err);
  res.status(500).json({ error: "Erro interno" });
});

const port = process.env.PORT || 4000;

connectDB(process.env.MONGO_URI)
  .then(() => app.listen(port, () => console.log(`🚀 API em http://localhost:${port}`)))
  .catch((e) => {
    console.error("Falha ao conectar no MongoDB:", e.message);
    process.exit(1);
  });
