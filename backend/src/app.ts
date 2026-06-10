import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { logger } from "./logger";
import { errorHandler, notFoundHandler } from "./middleware/errors";
import { attachmentRouter } from "./routes/attachments";
import { authRouter } from "./routes/auth";
import { exportRouter } from "./routes/export";
import {
  auditRouter,
  dashboardRouter,
  moduleDefRouter,
  notificationRouter,
  reviewRouter,
} from "./routes/misc";
import { serviceGroupRouter } from "./routes/serviceGroups";
import { userRouter } from "./routes/users";

export function createApp(): express.Express {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "5mb" }));
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/health" } }));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRouter);
  app.use("/api/module-definitions", moduleDefRouter);
  app.use("/api/service-groups", serviceGroupRouter);
  app.use("/api/service-groups", attachmentRouter);
  app.use("/api/export", exportRouter);
  app.use("/api/users", userRouter);
  app.use("/api/audit", auditRouter);
  app.use("/api/notifications", notificationRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/reviews", reviewRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
