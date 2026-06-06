import type { Request, Response, NextFunction } from "express";

export function cacheControl(maxAge: number, sMaxAge?: number, isPublic = false) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const scope = isPublic ? "public" : "private";
    const cache = `${scope}, max-age=${maxAge}${sMaxAge ? `, stale-while-revalidate=${sMaxAge}` : ""}`;
    res.set("Cache-Control", cache);
    next();
  };
}
