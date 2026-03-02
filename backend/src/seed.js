require("dotenv").config();
const bcrypt = require("bcryptjs");
const { connectDB } = require("./db");
const User = require("./models/User");

async function run() {
  await connectDB(process.env.MONGO_URI);

  const adminUser = await User.findOne({ username: "admin" });
  if (!adminUser) {
    await User.create({
      username: "admin",
      email: "admin@asbras.com",
      passwordHash: await bcrypt.hash("Adm1n@123", 10),
      role: "admin"
    });
    console.log("✅ Criado admin: admin / Adm1n@123");
  } else {
    console.log("ℹ️ Admin já existe");
  }

  const normalUser = await User.findOne({ username: "user" });
  if (!normalUser) {
    await User.create({
      username: "user",
      email: "user@asbras.com",
      passwordHash: await bcrypt.hash("user123", 10),
      role: "user"
    });
    console.log("✅ Criado user: user / user123");
  } else {
    console.log("ℹ️ User já existe");
  }

  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
