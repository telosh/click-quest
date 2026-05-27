import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import App from "./App";
import "./styles/global.css";

if (import.meta.env.VITE_E2E === "true") {
  void import("./testing/e2eApi").then(({ installE2eApi }) => installE2eApi());
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
);
