import { Link, NavLink, useNavigate } from "react-router-dom";
import { auth } from "../auth";
import logo from "../assets/logo.avif";

export default function Nav() {
  const navigate = useNavigate();
  const logged = auth.isLogged();
  const role = auth.getRole();
  const user = auth.getUsername();

  function logout() {
    auth.logout();
    navigate("/login");
  }

  const cls = ({ isActive }) => "navlink" + (isActive ? " active" : "");

  return (
    <div className="header">
      <div className="nav-full">
        <div className="nav">
          <div className="nav-left">
            <img src={logo} alt="ASBRAS" className="brand-logo" style={{ width: 45, height: 45 }} />
            <div className="brand-text">
              <div className="title">ASBRAS</div>
              <div className="subtitle">Associação Brasileira de Atenção à Assistência em Saúde</div>
            </div>
          </div>

          <div className="nav-center">
            {logged && role === "admin" && (
              <>
                <NavLink to="/admin/produtos" className={cls}>Produtos</NavLink>
                <NavLink to="/admin/entradas" className={cls}>Entradas</NavLink>
                <NavLink to="/admin/relatorios" className={cls}>Relatórios</NavLink>
              </>
            )}
          </div>

          <div className="nav-right">
            {logged && (
              <div className="rightbox">
                <span className="badge">{role.toUpperCase()}</span>
                <span><b>{user}</b></span>
                <button className="secondary" onClick={logout}>Sair</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
