// Le lista de origens permitidas para CORS (separadas por virgula).
function getAllowedOrigins() {
  const raw = process.env.CORS_ORIGIN || "";
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

// Indica se a aplicacao esta em ambiente de producao.
function isProduction() {
  return process.env.NODE_ENV === "production";
}

// Opcoes padrao do cookie de autenticacao.
function authCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60 * 1000
  };
}

// Opcoes para limpar cookie mantendo mesmos atributos.
function clearAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/"
  };
}

// Parser simples para cabecalho Cookie em formato "k=v; k2=v2".
function parseCookies(headerValue) {
  if (!headerValue || typeof headerValue !== "string") return {};

  return headerValue.split(";").reduce((acc, part) => {
    const idx = part.indexOf("=");
    if (idx < 0) return acc;
    const key = part.slice(0, idx).trim();
    const value = decodeURIComponent(part.slice(idx + 1).trim());
    acc[key] = value;
    return acc;
  }, {});
}

module.exports = {
  getAllowedOrigins,
  authCookieOptions,
  clearAuthCookieOptions,
  parseCookies,
  isProduction
};
