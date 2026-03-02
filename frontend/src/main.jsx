import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import App from "./App.jsx";

// Ponto de entrada da aplicacao React.
ReactDOM.createRoot(document.getElementById("root")).render(
  // StrictMode ajuda a detectar efeitos colaterais no desenvolvimento.
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
