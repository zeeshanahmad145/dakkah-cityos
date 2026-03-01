import { defineNitroConfig } from "nitropack/config"

export default defineNitroConfig({
  rollupConfig: {
    onwarn(warning, warn) {
      // Suppress "use client"/"use server" MODULE_LEVEL_DIRECTIVE warnings from
      // vendored packages such as @tanstack/react-query — these directives are
      // React Server Components annotations that have no meaning in the Nitro
      // node-listener bundle and are harmlessly stripped.
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
})
