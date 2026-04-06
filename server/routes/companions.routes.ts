import { Router } from "express";
import { asyncHandler } from "../middleware/error-handler";
import { storage } from "../storage";

export const companionsRouter = Router();

// GET /api/v1/companions — List active companions (excluding system prompt fields)
companionsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const companions = await storage.listCompanions();
    res.json(
      companions.map((c) => ({
        id: c.id,
        displayName: c.displayName,
        tagline: c.tagline,
        bio: c.bio,
        faithLane: c.faithLane,
        status: c.status,
        sortOrder: c.sortOrder,
      })),
    );
  }),
);

// GET /api/v1/companions/:id — Get companion profile detail (excluding system prompt fields)
companionsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const companion = await storage.getCompanion(req.params.id as string);
    if (!companion) {
      res.status(404).json({ message: "Companion not found" });
      return;
    }

    res.json({
      id: companion.id,
      displayName: companion.displayName,
      tagline: companion.tagline,
      bio: companion.bio,
      faithLane: companion.faithLane,
      status: companion.status,
      sortOrder: companion.sortOrder,
    });
  }),
);
