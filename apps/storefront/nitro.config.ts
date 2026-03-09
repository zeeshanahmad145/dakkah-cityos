import { defineNitroConfig } from "nitropack"

export default defineNitroConfig({
  rollupConfig: {
    onwarn(warning, warn) {
      // Suppress "use client"/"use server" MODULE_LEVEL_DIRECTIVE warnings
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