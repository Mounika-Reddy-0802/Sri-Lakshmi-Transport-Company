// The single list envelope every collection endpoint returns:
//   { data, page, limit, total, pages }
//
// The plan specifies { data, page, total }; limit and pages are included as
// well so a client can render a pager without recomputing anything.
import type { FilterQuery, Model, PopulateOptions, SortOrder } from "mongoose";

export type ListEnvelope<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type ListOptions = {
  page: number;
  limit: number;
  sort?: Record<string, SortOrder>;
  populate?: (string | PopulateOptions)[];
  select?: string;
};

/**
 * Runs a scoped, paginated query. `filter` must already have been narrowed by
 * scopeToTenant() — this helper deliberately does no scoping of its own, so an
 * unscoped call is visible at the call site rather than hidden in here.
 */
export async function paginate<T>(
  model: Model<T>,
  filter: FilterQuery<T>,
  options: ListOptions,
): Promise<ListEnvelope<T>> {
  const { page, limit, sort = { createdAt: -1 }, populate = [], select } = options;

  let query = model
    .find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);

  if (select) query = query.select(select);
  if (populate.length > 0) query = query.populate(populate);

  const [data, total] = await Promise.all([
    query.lean<T[]>().exec(),
    model.countDocuments(filter).exec(),
  ]);

  return { data, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
}
