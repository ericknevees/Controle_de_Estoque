const KEY = "estoque_token";
const KEY_ROLE = "estoque_role";
const KEY_USER = "estoque_user";

export const auth = {
  getToken: () => localStorage.getItem(KEY),
  getRole: () => localStorage.getItem(KEY_ROLE),
  getUsername: () => localStorage.getItem(KEY_USER),
  isLogged: () => !!localStorage.getItem(KEY),
  saveSession: ({ token, role, username }) => {
    localStorage.setItem(KEY, token);
    localStorage.setItem(KEY_ROLE, role);
    localStorage.setItem(KEY_USER, username);
  },
  logout: () => {
    localStorage.removeItem(KEY);
    localStorage.removeItem(KEY_ROLE);
    localStorage.removeItem(KEY_USER);
  }
};
