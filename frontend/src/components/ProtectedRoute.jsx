import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../auth";
import { api } from "../api";

// Guard de rota: valida sessao no backend antes de renderizar tela protegida.
export default function ProtectedRoute({ role, children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    // Evita setState apos desmontar durante requisicoes em andamento.
    let active = true;
    api
      .me()
      .then((session) => {
        if (!active) return;
        auth.saveSession(session);
        setStatus("ok");
      })
      .catch(() => {
        if (!active) return;
        auth.logout();
        setStatus("denied");
      });
    return () => {
      active = false;
    };
  }, []);

  // Enquanto valida sessao, evita piscar conteudo protegido.
  if (status === "checking") return null;
  // Sem sessao valida, volta para login.
  if (status === "denied") return <Navigate to="/login" replace />;
  // Se a rota exige role, confirma permissao.
  if (role && auth.getRole() !== role) return <Navigate to="/login" replace />;
  return children;
}
