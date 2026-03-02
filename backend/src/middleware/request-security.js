// Limite de profundidade para evitar payloads recursivos abusivos.
const MAX_RECURSION_DEPTH = 8;

// Percorre objeto/array e detecta chaves com "$" ou ".".
function hasDangerousKeys(value, depth = 0) {
  if (!value || typeof value !== "object") return false;
  if (depth > MAX_RECURSION_DEPTH) return true;

  if (Array.isArray(value)) {
    return value.some((item) => hasDangerousKeys(item, depth + 1));
  }

  return Object.keys(value).some((key) => {
    if (key.includes("$") || key.includes(".")) return true;
    return hasDangerousKeys(value[key], depth + 1);
  });
}

// Rejeita payload com operadores usados em ataques NoSQL injection.
function rejectNoSqlOperators(req, res, next) {
  if (hasDangerousKeys(req.body) || hasDangerousKeys(req.query) || hasDangerousKeys(req.params)) {
    return res.status(400).json({ error: "Payload invalido" });
  }
  next();
}

module.exports = { rejectNoSqlOperators };
