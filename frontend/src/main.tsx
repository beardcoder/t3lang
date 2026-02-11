import React from "react";
import { createRoot } from "react-dom/client";
import { enableMapSet } from "immer";
import "./index.css";
import App from "./App";

enableMapSet();

const container = document.getElementById("root");

const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
