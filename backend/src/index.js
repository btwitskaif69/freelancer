import express from "express";
import cors from "cors";
import { apiRouter } from "./routes/index.js";
import { prisma } from "./lib/prisma.js";

const runningInVercel = process.env.VERCEL === "1";

const normalizeOrigin = (origin: string | undefined) =>
  typeof origin === "string" ? origin.replace(/\/+$/, "") : origin;

const resolveAllowedOrigins = () => {
  const sources = [
    env.CORS_ORIGIN,
    env.LOCAL_CORS_ORIGIN,
    env.VERCEL_CORS_ORIGIN
  ].filter((value) => typeof value === "string" && value.length > 0);

  if (sources.length === 0) {
    return undefined;
  }

  const parsedOrigins = sources.flatMap((value) =>
    value
      .split(",")
      .map((origin) => normalizeOrigin(origin.trim()))
      .filter(Boolean)
  );

  if (parsedOrigins.length === 0 || parsedOrigins.includes("*")) {
    return undefined;
  }

  return [...new Set(parsedOrigins)];
};

export const createApp = () => {
  const app = express();

<<<<<<< HEAD
  const allowedOrigins = resolveAllowedOrigins();
=======
  const corsOriginEnv = process.env.CORS_ORIGIN;
  const allowedOrigins =
    corsOriginEnv === "*" || !corsOriginEnv
      ? undefined
      : corsOriginEnv
          .split(",")
          .map((origin) => normalizeOrigin(origin.trim()))
          .filter(Boolean);
>>>>>>> 81da39ca0a160a79282669d04110335132a9b3fa

  app.use(
    cors({
      origin: allowedOrigins,
      // ...other cors options
    })
  );

  app.use(express.json());
  app.use("/api", apiRouter);

  return app;
};
