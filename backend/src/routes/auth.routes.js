const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "username e password obrigatórios" });

  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: "Credenciais inválidas" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Credenciais inválidas" });

  const token = jwt.sign(
    { id: user._id.toString(), username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({ token, role: user.role, username: user.username });
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, password, email, role = "user" } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ message: "username, password e email obrigatórios" });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "Usuário ou email já cadastrado" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      passwordHash,
      role
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id.toString(), username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.status(201).json({ token, role: user.role, username: user.username, message: "Cadastro realizado com sucesso" });
  } catch (err) {
    res.status(500).json({ message: "Erro ao cadastrar usuário" });
  }
});

module.exports = router;