import { medusaApp } from "@medusajs/framework";
import { resolve } from "path";
import express from "express";

export const startCustomE2EServer = async () => {
  const app = express();

  // Create a Medusa app instance pointing to the current directory
  const { link, query, container } = await medusaApp({
    modulesConfig: {},
    projectConfig: {
      databaseUrl: process.env.DATABASE_URL,
    },
    // We only load what's necessary to connect to DB and expose routes
    env: {
      NODE_ENV: "development",
    },
  });

  // Since medusaApp only returns services and the container, to get real HTTP routes,
  // we actually need to boot it via the official loaders.
};
