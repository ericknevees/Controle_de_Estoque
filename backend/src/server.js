// Carrega variaveis de ambiente no inicio da aplicacao.
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { connectDB } = require("./db");
const { getAllowedOrigins } = require("./utils/security");
const { rejectNoSqlOperators } = require("./middleware/request-security");

const authRoutes = require("./routes/auth.routes");
const productsRoutes = require("./routes/products.routes");
const entriesRoutes = require("./routes/entries.routes");
const exitsRoutes = require("./routes/exits.routes");
const reportsRoutes = require("./routes/reports.routes");

// Inicializa servidor e lista de origens permitidas para CORS.
const app = express();
const allowedOrigins = getAllowedOrigins();

// Hardening basico de cabecalhos e proxy.
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet());

// CORS restrito por variavel de ambiente.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) return callback(new Error("CORS bloqueado"), false);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin nao permitida no CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Limita payload JSON para reduzir risco de abuso.
app.use(express.json({ limit: "10kb" }));
// Bloqueia payload com chaves potencialmente perigosas para NoSQL.
app.use(rejectNoSqlOperators);

// Protege login contra forca bruta.
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Tente novamente em 15 minutos." }
});
app.use("/api/auth/login", authRateLimit);

// Limita solicitacoes de recuperacao/redefinicao de senha.
const passwordRecoveryRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Tente novamente em 15 minutos." }
});
app.use("/api/auth/forgot-password", passwordRecoveryRateLimit);
app.use("/api/auth/reset-password", passwordRecoveryRateLimit);
app.use("/api/auth/change-password", passwordRecoveryRateLimit);

// Healthcheck para monitoramento do servico.
app.get("/health", (req, res) => res.json({ ok: true }));

// Monta rotas da API.
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/entries", entriesRoutes);
app.use("/api/exits", exitsRoutes);
app.use("/api/reports", reportsRoutes);

// Handler global de erros nao tratados.
app.use((err, req, res, next) => {
  console.error("Erro:", err.message);
  res.status(500).json({ error: "Erro interno" });
});

const port = process.env.PORT || 4000;

// Inicia servidor somente apos conectar no banco.
connectDB(process.env.MONGO_URI)
  .then(() => app.listen(port, () => console.log(`API em http://localhost:${port}`)))
  .catch((e) => {
    console.error("Falha ao conectar no MongoDB:", e.message);
    process.exit(1);
  });
