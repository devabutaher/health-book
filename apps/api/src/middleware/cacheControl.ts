import type { Request, Response, NextFunction } from "express";

export function cacheControl(maxAge: number, sMaxAge?: number) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const cache = `private, max-age=${maxAge}${sMaxAge ? `, stale-while-revalidate=${sMaxAge}` : ""}`;
    res.set("Cache-Control", cache);
    next();
  };
}
