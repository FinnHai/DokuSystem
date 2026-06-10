import { NextFunction, Request, Response } from "express";
import { logger } from "../logger";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Ressource nicht gefunden" });
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  logger.error({ err }, "Unbehandelter Fehler");
  res.status(500).json({ error: "Interner Serverfehler" });
}

/** Async-Route-Wrapper, leitet Fehler an den zentralen Handler weiter. */
export function wrap(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
