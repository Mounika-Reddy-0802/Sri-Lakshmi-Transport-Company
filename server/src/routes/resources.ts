// Generic CRUD router, instantiated once per collection.
//
// Why a factory rather than six hand-written routers: the multi-tenant rule is
// the easiest thing in this codebase to get wrong, and the consequence of
// getting it wrong is one client reading another's data. Writing the scoped
// query exactly once means a new resource cannot forget it — every read goes
// through `scopedFilter()` below.
//
// Reads are open to all roles (narrowed by scope); writes are admin-only.
import { Router, type Request, type Response, type NextFunction } from "express";
import { Types, type FilterQuery, type Model, type PopulateOptions, type SortOrder } from "mongoose";
import type { ZodTypeAny } from "zod";
import { connectToDatabase } from "../db";
import { paginate } from "../http/list";
import { notFound } from "../http/errors";
import { requireAuth, requireRole, scopeToTenant } from "../middleware/auth";
import { zodValidate } from "../middleware/validate";
import { idParam, listQuery } from "./schemas";

/** Escapes a user-supplied string before it is used in a $regex. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type ResourceConfig<T> = {
  /** URL segment, e.g. "buses". */
  path: string;
  model: Model<T>;
  createSchema: ZodTypeAny;
  updateSchema: ZodTypeAny;
  /** Defaults to the shared page/limit/q schema. */
  querySchema?: ZodTypeAny;
  /** Fields a `?q=` search matches against, case-insensitively. */
  searchFields?: string[];
  sort?: Record<string, SortOrder>;
  populate?: (string | PopulateOptions)[];
  select?: string;
  /**
   * Narrows every read to what the caller may see. Defaults to the standard
   * organizationId scope.
   */
  scope?: (req: Request) => FilterQuery<T>;
  /** Set when a dedicated router already serves GET /:path/:id. */
  excludeGetOne?: boolean;
  /** Extra equality filters lifted from the query string. */
  filterFields?: string[];
};

export function createResourceRouter<T>(config: ResourceConfig<T>): Router {
  const {
    path,
    model,
    createSchema,
    updateSchema,
    querySchema = listQuery,
    searchFields = [],
    sort = { createdAt: -1 },
    populate = [],
    select,
    scope = (req) => scopeToTenant(req) as FilterQuery<T>,
    excludeGetOne = false,
    filterFields = [],
  } = config;

  const router = Router();

  /** Tenant scope + search + simple equality filters, in that order. */
  function scopedFilter(req: Request): FilterQuery<T> {
    const filter = { ...scope(req) } as Record<string, unknown>;
    const query = req.query as Record<string, unknown>;

    const q = typeof query.q === "string" ? query.q.trim() : "";
    if (q && searchFields.length > 0) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = searchFields.map((field) => ({ [field]: rx }));
    }

    for (const field of filterFields) {
      const value = query[field];
      if (value !== undefined) filter[field] = value;
    }

    return filter as FilterQuery<T>;
  }

  // ---- list -------------------------------------------------------------
  router.get(
    `/${path}`,
    requireAuth,
    zodValidate({ query: querySchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await connectToDatabase();
        const { page, limit } = req.query as unknown as { page: number; limit: number };
        const result = await paginate(model, scopedFilter(req), {
          page,
          limit,
          sort,
          populate,
          ...(select ? { select } : {}),
        });
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  // ---- read one ---------------------------------------------------------
  if (!excludeGetOne) {
    router.get(
      `/${path}/:id`,
      requireAuth,
      zodValidate({ params: idParam }),
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          await connectToDatabase();
          // The id is ANDed with the tenant scope, so a document belonging to
          // another organization simply is not found — the response is
          // identical to a genuinely missing id and leaks nothing.
          const filter = {
            ...scope(req),
            _id: new Types.ObjectId(req.params.id),
          } as FilterQuery<T>;

          let query = model.findOne(filter);
          if (populate.length > 0) query = query.populate(populate);
          if (select) query = query.select(select);

          const doc = await query.lean<T>().exec();
          if (!doc) {
            next(notFound(`No ${path.replace(/s$/, "")} with that id.`));
            return;
          }
          res.status(200).json(doc);
        } catch (error) {
          next(error);
        }
      },
    );
  }

  // ---- create (admin) ---------------------------------------------------
  router.post(
    `/${path}`,
    requireAuth,
    requireRole("admin"),
    zodValidate({ body: createSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await connectToDatabase();
        const created = await model.create(req.body);
        res.status(201).json(created.toObject());
      } catch (error) {
        next(error);
      }
    },
  );

  // ---- update (admin) ---------------------------------------------------
  router.patch(
    `/${path}/:id`,
    requireAuth,
    requireRole("admin"),
    zodValidate({ params: idParam, body: updateSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await connectToDatabase();
        const updated = await model
          .findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true })
          .lean<T>()
          .exec();

        if (!updated) {
          next(notFound(`No ${path.replace(/s$/, "")} with that id.`));
          return;
        }
        res.status(200).json(updated);
      } catch (error) {
        next(error);
      }
    },
  );

  // ---- delete (admin) ---------------------------------------------------
  router.delete(
    `/${path}/:id`,
    requireAuth,
    requireRole("admin"),
    zodValidate({ params: idParam }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await connectToDatabase();
        const deleted = await model.findByIdAndDelete(req.params.id).lean<T>().exec();
        if (!deleted) {
          next(notFound(`No ${path.replace(/s$/, "")} with that id.`));
          return;
        }
        res.status(200).json({ ok: true, id: req.params.id });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
