// Script de seed para criar usuarios iniciais de forma segura.
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { connectDB } = require("./db");
const User = require("./models/User");

// Exige no minimo 6 caracteres no seed.
const PASSWORD_REGEX = /^.{6,128}$/;

// Garante que variaveis obrigatorias foram definidas.
function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel obrigatoria ausente: ${name}`);
  }
  return value;
}

// Valida a forca da senha antes de gravar no banco.
function validateSeedPassword(password, envName) {
  if (!PASSWORD_REGEX.test(password)) {
    throw new Error(`${envName} fraca. Use 6+ caracteres.`);
  }
}

// Cria usuario somente se ele ainda nao existir.
async function ensureUser({ username, email, password, role }) {
  const existing = await User.findOne({ username });
  if (existing) {
    console.log(`Usuario ${username} ja existe`);
    return;
  }

  await User.create({
    username,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role
  });
  console.log(`Usuario ${username} criado (${role})`);
}

// Fluxo principal do seed.
async function run() {
  await connectDB(process.env.MONGO_URI);

  const adminPassword = requireEnv("SEED_ADMIN_PASSWORD");
  const userPassword = requireEnv("SEED_USER_PASSWORD");
  validateSeedPassword(adminPassword, "SEED_ADMIN_PASSWORD");
  validateSeedPassword(userPassword, "SEED_USER_PASSWORD");

  await ensureUser({
    username: process.env.SEED_ADMIN_USERNAME || "admin",
    email: process.env.SEED_ADMIN_EMAIL || "admin@asbras.com",
    password: adminPassword,
    role: "admin"
  });

  await ensureUser({
    username: process.env.SEED_USER_USERNAME || "user",
    email: process.env.SEED_USER_EMAIL || "user@asbras.com",
    password: userPassword,
    role: "user"
  });

  process.exit(0);
}

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
