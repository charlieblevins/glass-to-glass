/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_TEST_VIDEO_CREATOR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
