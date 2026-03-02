const mongoose = require("mongoose");

// Abre conexao com MongoDB usando a URI informada no ambiente.
async function connectDB(uri) {
  // Habilita parser estrito de query para evitar filtros ambiguos.
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("MongoDB conectado");
}

module.exports = { connectDB };
