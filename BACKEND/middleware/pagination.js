const pagination = (req, res, next) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    req.pagination = {
        page,
        limit,
        skip,
    };

    const originalJson = res.json.bind(res);
    res.json = (body) => {
        if (body && body.data && Array.isArray(body.data) && req.paginationTotal !== undefined) {
            const totalItems = req.paginationTotal;
            const totalPages = Math.ceil(totalItems / limit);

            body.pagination = {
                currentPage: page,
                pageSize: limit,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            };
        }
        return originalJson(body);
    };

    next();
};

module.exports = pagination;
