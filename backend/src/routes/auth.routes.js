const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { auditLog } = require("../utils/audit");
const { authCookieOptions, clearAuthCookieOptions } = require("../utils/security");
const { sanitizeText, validateCredentials } = require("../utils/validation");
const { sendPasswordResetEmail } = require("../utils/email");

const router = express.Router();

// Gera JWT com dados minimos de sessao.
function signUserToken(user) {
  return jwt.sign(
    { id: user._id.toString(), username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
}

// Retorna hash SHA-256 para token de reset sem salvar valor puro no banco.
function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Login com validacao de credenciais e emissao de cookie HttpOnly.
router.post("/login", async (req, res) => {
  const username = sanitizeText(req.body?.username, 32);
  const password = req.body?.password;
  if (!username || !password) {
    return res.status(400).json({ error: "username e password obrigatorios" });
  }

  const user = await User.findOne({ username });
  if (!user) {
    auditLog(req, "auth.login.failed", { username });
    return res.status(401).json({ error: "Credenciais invalidas" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    auditLog(req, "auth.login.failed", { username });
    return res.status(401).json({ error: "Credenciais invalidas" });
  }

  const token = signUserToken(user);
  res.cookie("access_token", token, authCookieOptions());
  auditLog(req, "auth.login.success", { username: user.username, role: user.role });
  res.json({ token, role: user.role, username: user.username });
});

// Cadastro de usuario comum (role sempre "user").
router.post("/register", async (req, res) => {
  try {
    const { username, password, email } = req.body || {};
    if (!username || !password || !email) {
      return res.status(400).json({ message: "username, password e email obrigatorios" });
    }

    const validated = validateCredentials({ username, email, password });
    if (!validated.ok) {
      return res.status(400).json({ message: validated.error });
    }

    const existingUser = await User.findOne({
      $or: [{ username: validated.username }, { email: validated.email }]
    });
    if (existingUser) {
      return res.status(400).json({ message: "Usuario ou email ja cadastrado" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      username: validated.username,
      email: validated.email,
      passwordHash,
      role: "user"
    });

    await user.save();

    const token = signUserToken(user);
    res.cookie("access_token", token, authCookieOptions());
    auditLog(req, "auth.register.success", { username: user.username });

    res.status(201).json({
      token,
      role: user.role,
      username: user.username,
      message: "Cadastro realizado com sucesso"
    });
  } catch (err) {
    res.status(500).json({ message: "Erro ao cadastrar usuario" });
  }
});

// Encerra sessao removendo cookie de acesso.
router.post("/logout", requireAuth, (req, res) => {
  auditLog(req, "auth.logout");
  res.clearCookie("access_token", clearAuthCookieOptions());
  res.status(204).send();
});

// Retorna sessao atual para o frontend montar contexto.
router.get("/me", requireAuth, (req, res) => {
  res.json({ username: req.user.username, role: req.user.role });
});

// Permite trocar senha estando autenticado.
router.post("/change-password", requireAuth, async (req, res) => {
  const currentPassword = req.body?.currentPassword || "";
  const newPassword = req.body?.newPassword || "";

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "currentPassword e newPassword obrigatorios" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "senha fraca. Minimo 6 caracteres" });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: "Usuario nao encontrado" });
  }

  const currentPasswordOk = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!currentPasswordOk) {
    auditLog(req, "auth.change_password.invalid_current", { userId: req.user.id });
    return res.status(400).json({ error: "Senha atual incorreta" });
  }

  const samePassword = await bcrypt.compare(newPassword, user.passwordHash);
  if (samePassword) {
    return res.status(400).json({ error: "A nova senha deve ser diferente da atual" });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  await user.save();

  auditLog(req, "auth.change_password.success", { userId: req.user.id });
  return res.json({ message: "Senha alterada com sucesso" });
});

// Solicita recuperacao de senha via email cadastrado.
router.post("/forgot-password", async (req, res) => {
  const email = sanitizeText(req.body?.email, 120).toLowerCase();

  // Resposta generica para nao revelar se email existe.
  const genericOk = { message: "Se o email existir, enviaremos um link para redefinicao." };
  if (!email) return res.json(genericOk);

  const user = await User.findOne({ email });
  if (!user) {
    auditLog(req, "auth.forgot_password.unknown_email", { email });
    return res.json(genericOk);
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const ttlMinutes = Number(process.env.RESET_TOKEN_TTL_MINUTES || 15);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  user.passwordResetTokenHash = tokenHash;
  user.passwordResetExpiresAt = expiresAt;
  await user.save();

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

  try {
    await sendPasswordResetEmail(user.email, resetLink);
    auditLog(req, "auth.forgot_password.sent", { userId: user._id.toString() });
  } catch (err) {
    auditLog(req, "auth.forgot_password.email_error", { userId: user._id.toString(), error: err.message });
  }

  return res.json(genericOk);
});

// Redefine senha a partir de token temporario.
router.post("/reset-password", async (req, res) => {
  const token = sanitizeText(req.body?.token, 256);
  const newPassword = req.body?.newPassword || "";

  if (!token || !newPassword) {
    return res.status(400).json({ error: "token e newPassword obrigatorios" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "senha fraca. Minimo 6 caracteres" });
  }

  const tokenHash = hashResetToken(token);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() }
  });

  if (!user) {
    auditLog(req, "auth.reset_password.invalid_token");
    return res.status(400).json({ error: "Token invalido ou expirado" });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  await user.save();

  auditLog(req, "auth.reset_password.success", { userId: user._id.toString() });
  return res.json({ message: "Senha redefinida com sucesso" });
});

module.exports = router;
