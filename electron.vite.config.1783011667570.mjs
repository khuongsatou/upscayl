// electron.vite.config.ts
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { devtools } from "@tanstack/devtools-vite";
import tailwindcss from "@tailwindcss/vite";
var __electron_vite_injected_dirname = "/media/Storage/GitHub/upscayl";
var electron_vite_config_default = defineConfig({
  main: {
    resolve: {
      alias: {
        "@electron": resolve(__electron_vite_injected_dirname, "./electron"),
        "@common": resolve(__electron_vite_injected_dirname, "./common")
      }
    },
    build: {
      outDir: "out/main",
      rollupOptions: {
        input: {
          index: resolve(__electron_vite_injected_dirname, "./electron/index.ts")
        }
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        "@electron": resolve(__electron_vite_injected_dirname, "./electron"),
        "@common": resolve(__electron_vite_injected_dirname, "./common")
      }
    },
    build: {
      outDir: "out/preload",
      rollupOptions: {
        input: {
          index: resolve(__electron_vite_injected_dirname, "./electron/preload.ts")
        }
      }
    }
  },
  renderer: {
    root: resolve(__electron_vite_injected_dirname, "./renderer"),
    plugins: [
      react(),
      devtools({
        injectSource: {
          enabled: true,
          ignore: {
            files: ["node_modules", /.*\.test\.(js|ts|jsx|tsx)$/],
            components: ["InternalComponent", /.*Provider$/]
          }
        },
        logging: true,
        enhancedLogs: {
          enabled: true
        }
      }),
      tailwindcss()
    ],
    resolve: {
      alias: {
        "@": resolve(__electron_vite_injected_dirname, "./renderer"),
        "@common": resolve(__electron_vite_injected_dirname, "./common"),
        "@components": resolve(__electron_vite_injected_dirname, "./renderer/components"),
        "@lib/utils": resolve(__electron_vite_injected_dirname, "./renderer/lib/utils")
      }
    },
    build: {
      outDir: resolve(__electron_vite_injected_dirname, "./out/renderer"),
      rollupOptions: {
        input: {
          index: resolve(__electron_vite_injected_dirname, "./renderer/index.html")
        }
      }
    }
  }
});
export {
  electron_vite_config_default as default
};
