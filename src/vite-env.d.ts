/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_E2E?: string;
  readonly VITE_DEBUG_PANEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
