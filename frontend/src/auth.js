const KEY_ROLE = "estoque_role";
const KEY_USER = "estoque_user";
const KEY_TOKEN = "estoque_token";

// Estado de sessao minimo salvo no navegador para UX.
export const auth = {
  getRole: () => localStorage.getItem(KEY_ROLE),
  getUsername: () => localStorage.getItem(KEY_USER),
  getToken: () => localStorage.getItem(KEY_TOKEN),
  isLogged: () => !!localStorage.getItem(KEY_TOKEN),
  saveSession: ({ role, username, token }) => {
    localStorage.setItem(KEY_ROLE, role);
    localStorage.setItem(KEY_USER, username);
    if (token) {
      localStorage.setItem(KEY_TOKEN, token);
    }
  },
  logout: () => {
    localStorage.removeItem(KEY_ROLE);
    localStorage.removeItem(KEY_USER);
    localStorage.removeItem(KEY_TOKEN);
  }
};
