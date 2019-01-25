const qs = require('qs');

module.exports = (request, defaultSize = 10) => {
	this.request = request;
	this.defaultSize = defaultSize;
	this.params = {};

	let params = {...request.query.page};
	let limits = this.limits = {
		start: 0,
		count: defaultSize
	};

	if (params) {
		if (params.size && !isNaN(params.size) && params.size > 0) {
			limits.count = this.params.size = parseInt(params.size, 10);
		}

		if (params.offset && !isNaN(params.offset) && params.offset >= 0) {
			limits.start = this.params.offset = parseInt(params.offset, 10);
		} else if (params.number && !isNaN(params.number) && params.number > 0) {
			this.params.number = parseInt(params.number, 10);
			limits.start = this.params.number * limits.count - limits.count;
		} else {
			this.params.number = 1;
		}
	}

	this.getLinks = (totalResults) => {
		let links = {};
		let getLink = (param) => {
			return this.request.path + '?' + qs.stringify({...request.query, page: {...this.params, ...param}});
		};

		if (this.params.offset !== undefined) {
			if (this.params.offset > 0) {
				links.first = getLink({offset: 0});

				if (this.params.offset < totalResults - this.limits.count) {
					links.prev = getLink({offset: this.params.offset - this.limits.count < 0 ? 0 : this.params.offset - this.limits.count});
				}
			}
			if (this.params.offset + this.limits.count < totalResults) {
				links.next = getLink({offset: this.params.offset + this.limits.count});
			}
			links.last = getLink({offset: totalResults - this.limits.count});
		} else {
			let pagesCount = totalResults / this.limits.count;

			if (this.params.number > 1) {
				links.first = getLink({number: 1});

				if (this.params.number < pagesCount) {
					links.prev = getLink({number: this.params.number - 1});
				}
			}

			if (this.params.number < pagesCount) {
				links.next = getLink({number: this.params.number + 1});
			}

			links.last = getLink({number: Math.ceil(pagesCount)});
		}
		return links;
	};

	return this;
};
