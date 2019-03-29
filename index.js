const qs = require('qs');

module.exports = (request, defaultSize = 10, maxSize = 100) => {
	const params = (() => {
		const params = {};
		let originalPageQuery;
		if (request.query.page) {
			originalPageQuery = request.query.page;
			if (originalPageQuery.size && !isNaN(originalPageQuery.size) && originalPageQuery.size > 0) {
				if (originalPageQuery.size > maxSize) {
					params.size = maxSize;
				} else {
					params.size = parseInt(originalPageQuery.size, 10);
				}
			}

			if (originalPageQuery.offset && !isNaN(originalPageQuery.offset) && originalPageQuery.offset >= 0) {
				params.offset = parseInt(originalPageQuery.offset, 10);
			} else if (originalPageQuery.number && !isNaN(originalPageQuery.number) && originalPageQuery.number > 0) {
				params.number = parseInt(originalPageQuery.number, 10);
			} else {
				params.number = 1;
			}
		}

		return params;
	})();
	const count = params.size || defaultSize;
	const limits = {
		count: count,
		start: params.offset || params.number * count - count || 0
	};

	return {
		request,
		params,
		limits,
		getLinks: function(totalResults) {
			const links = {};
			const getLink = (param) => {
				return this.request.path + '?' + qs.stringify({...request.query, page: {...this.params, ...param}}, {encode: false, indices: false});
			};

			if (this.params.offset !== undefined) {
				if (this.params.offset > 0) {
					links.first = getLink({offset: 0});

					if (this.params.offset >= this.limits.count) {
						links.prev = getLink({offset: this.params.offset - this.limits.count < 0 ? 0 : this.params.offset > totalResults ? totalResults - this.limits.count : this.params.offset - this.limits.count});
					}
				}
				if (this.params.offset + this.limits.count < totalResults) {
					links.next = getLink({offset: this.params.offset + this.limits.count});
				}

				if (this.params.offset + this.limits.count < totalResults || this.params.offset > totalResults) {
					links.last = getLink({
						offset: this.params.offset + this.limits.count > totalResults && this.params.offset < totalResults ? this.params.offset + this.limits.count : totalResults - this.limits.count
					});
				}
			} else {
				const pagesCount = Math.ceil(totalResults / this.limits.count);
				const pageNumber = this.params.number || 1;

				if (pageNumber > 1) {
					links.first = getLink({number: 1});

					if (pageNumber <= pagesCount || pageNumber > pagesCount) {
						links.prev = getLink({number: pageNumber - 1});
					}
				}

				if (pageNumber < pagesCount) {
					links.next = getLink({number: pageNumber + 1});
				}

				if (pageNumber !== pagesCount) {
					links.last = getLink({number: pagesCount});
				}
			}
			return Object.keys(links).length > 0 ? links : undefined;
		}
	};
};
