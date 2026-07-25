/**
 * Paginates a Mongoose query.
 *
 * @param {import('mongoose').Model} model - Mongoose model to query.
 * @param {object} filter - MongoDB filter object (e.g. { status: 'ACTIVE' }).
 * @param {object} options
 * @param {number} [options.page=1]    - Current page (1-indexed).
 * @param {number} [options.limit=10]  - Documents per page.
 * @param {object} [options.sort]      - Mongoose sort descriptor (default: newest first).
 * @param {object} [options.populate]  - Optional populate config passed to .populate().
 * @param {string|object} [options.select] - Optional field projection.
 * @returns {Promise<{data: any[], page: number, limit: number, total: number, totalPages: number}>}
 */
async function paginate(model, filter = {}, options = {}) {
  const {
    page = 1,
    limit = 10,
    sort = { createdAt: -1 },
    populate = null,
    select = null,
  } = options;

  const safePage = Math.max(1, parseInt(page, 10));
  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10)), 100); // cap at 100
  const skip = (safePage - 1) * safeLimit;

  let query = model.find(filter).sort(sort).skip(skip).limit(safeLimit);

  if (select) query = query.select(select);
  if (populate) query = query.populate(populate);

  const [data, total] = await Promise.all([
    query.lean(),
    model.countDocuments(filter),
  ]);

  return {
    data,
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.ceil(total / safeLimit),
  };
}

module.exports = { paginate };
