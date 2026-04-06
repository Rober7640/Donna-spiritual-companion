import type { Request, Response, NextFunction } from "express";
import { type ZodSchema, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const validationError = fromZodError(err);
        res.status(400).json({ message: validationError.message });
        return;
      }
      next(err);
    }
  };
}
