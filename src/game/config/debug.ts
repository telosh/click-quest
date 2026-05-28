/**
 * 開発時のみ。`VITE_DEBUG_PANEL=true` かつ非本番ビルドで表示。
 * `.env.local` が true でも `vite build`（deploy）では常に false。
 */
export const DEBUG_PANEL_ENABLED =
  !import.meta.env.PROD && import.meta.env.VITE_DEBUG_PANEL === "true";
