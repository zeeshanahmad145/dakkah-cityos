import medusaAiTags from "@medusajs-ai/tags"
import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import Terminal from "vite-plugin-terminal"
import viteTsConfigPaths from "vite-tsconfig-paths"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const isDev = mode === "development"
  const backendUrl =
    env.MEDUSA_BACKEND_URL ||
    env.VITE_MEDUSA_BACKEND_URL ||
    "http://localhost:9000"
  const publishableKey =
    env.MEDUSA_PUBLISHABLE_KEY || env.VITE_MEDUSA_PUBLISHABLE_KEY || ""

  return {
    envPrefix: "VITE_",
    define: {
      "import.meta.env.VITE_MEDUSA_BACKEND_URL": JSON.stringify(
        env.VITE_MEDUSA_BACKEND_URL || backendUrl,
      ),
      "import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY": JSON.stringify(
        env.VITE_MEDUSA_PUBLISHABLE_KEY || publishableKey,
      ),
    },
    plugins: [
      Terminal({ console: "terminal", output: ["terminal"] }),
      viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
      tailwindcss(),

      ...(isDev
        ? [
            medusaAiTags({
              enabled: true,
              includeRuntime: true,
            }),
          ]
        : []),

      tanstackStart({
        target: process.env.VERCEL ? "vercel" : "node",
        customViteReactPlugin: true,
      }),
      react(),

      // Suppress "use client"/"use server" MODULE_LEVEL_DIRECTIVE warnings from
      // @tanstack/react-query and similar packages during both the Vite and Nitro SSR bundling phases.
      {
        name: "suppress-use-client-warnings",
        enforce: "pre" as const,
        configResolved(config) {
          const existingOnWarn = config.build?.rollupOptions?.onwarn
          if (config.build?.rollupOptions) {
            config.build.rollupOptions.onwarn = (warning, defaultWarn) => {
              if (
                warning.code === "MODULE_LEVEL_DIRECTIVE" &&
                (warning.message?.includes('"use client"') ||
                  warning.message?.includes('"use server"'))
              ) {
                return
              }
              if (existingOnWarn) existingOnWarn(warning, defaultWarn)
              else defaultWarn(warning)
            }
          }
        },
      },

      {
        name: "commerce-admin-redirect",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const urlPath = (req.url || "").split("?")[0]
            if (
              urlPath === "/commerce/admin" ||
              urlPath === "/commerce/admin/"
            ) {
              res.writeHead(302, { Location: "/commerce/admin/login" })
              res.end()
              return
            }
            next()
          })
        },
      },
    ],

    server: {
      host: "0.0.0.0",
      port: 5000,
      strictPort: true,
      allowedHosts: true,
      proxy: {
        "/seed-images": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        "/platform": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        "/store": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        "/admin": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        "/commerce": {
          target: backendUrl,
          changeOrigin: true,
          ws: true,
          secure: false,
        },
        "/auth": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },

    ssr: {
      noExternal: [
        "@medusajs/js-sdk",
        "@medusajs/types",
        "lodash-es",
        "@dakkah-cityos/design-runtime",
        "@dakkah-cityos/design-tokens",
        "@dakkah-cityos/design-system",
      ],
    },

    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/react-router",
        "@medusajs/js-sdk",
        "@medusajs/icons",
        "lodash-es",
      ],
      exclude: ["@medusajs-ai/tags"],
    },

    resolve: {
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-router",
        "@tanstack/react-query",
      ],
    },

    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          // Suppress the vite:css-post sourcemap warning — expected with Tailwind v4 + Vite CSS pipeline
          if (
            warning.code === "SOURCEMAP_ERROR" ||
            warning.message?.includes("vite:css-post")
          ) {
            return
          }
          // Suppress "use client" / "use server" directive warnings from vendored packages
          // (e.g. @tanstack/react-query) that ship RSC directives — harmless in Nitro SSR bundle
          if (
            warning.code === "MODULE_LEVEL_DIRECTIVE" &&
            (warning.message?.includes('"use client"') ||
              warning.message?.includes('"use server"'))
          ) {
            return
          }
          warn(warning)
        },
      },
    },
  }
})
