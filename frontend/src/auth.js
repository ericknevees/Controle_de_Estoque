const KEY_ROLE = "estoque_role";
const KEY_USER = "estoque_user";
const KEY_LOGGED = "estoque_logged";

// Estado de sessao minimo salvo no navegador para UX.
export const auth = {
  getRole: () => localStorage.getItem(KEY_ROLE),
  getUsername: () => localStorage.getItem(KEY_USER),
  isLogged: () => localStorage.getItem(KEY_LOGGED) === "1",
  saveSession: ({ role, username }) => {
    localStorage.setItem(KEY_ROLE, role);
    localStorage.setItem(KEY_USER, username);
    localStorage.setItem(KEY_LOGGED, "1");
  },
  logout: () => {
    localStorage.removeItem(KEY_ROLE);
    localStorage.removeItem(KEY_USER);
    localStorage.removeItem(KEY_LOGGED);
  }
};
