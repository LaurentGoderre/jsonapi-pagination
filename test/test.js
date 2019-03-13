/* eslint-env mocha */
const assert = require('assert');
const pagination = require('../index');
const baseMockRequest = {
	path: '/pagination_test',
	query: {}
};

describe('Pagination', () => {
	describe('Default settings', () => {
		const request = {
			...baseMockRequest
		};
		const pages = pagination(request);

		it('should set the \'request\' property as the request argument', () => assert.strictEqual(pages.request, request));
		it('should set the \'params\' property as an empty object', () => assert.strictEqual(JSON.stringify(pages.params), '{}'));
		it('should set the \'limits\' property with the default values', () => assert.deepStrictEqual(pages.limits, {start: 0, count: 10}));
	});

	describe('Definining a custom default page size', () => {
		const request = {
			...baseMockRequest
		};
		const pages = pagination(request, 5);

		it('should set the \'limits\' property with the custom default size', () => assert.deepStrictEqual(pages.limits, {start: 0, count: 5}));
	});

	describe('Definining a custom max page size', () => {
		const request = {
			...baseMockRequest,
			query: {
				page: {
					size: 20
				}
			}
		};
		const pages = pagination(request, null, 10);

		it('should set the \'limits\' property with the custom default size', () => assert.deepStrictEqual(pages.limits, {start: 0, count: 10}));
	});

	describe('Offset-based Pagination', () => {
		const request = {
			...baseMockRequest,
			query: {
				page: {
					offset: 15,
					size: 2
				}
			}
		};
		const pages = pagination(request);

		it('should use the \'offset\' for the \'start\' property of the \'limits\' object', () => assert.strictEqual(pages.limits.start, 15));
		it('should use the \'size\' for the \'count\' property of the \'limits\' object', () => assert.strictEqual(pages.limits.count, 2));
		// TODO: 0 and negative pages;
	});

	describe('Paged-based Pagination', () => {
		const request = {
			...baseMockRequest,
			query: {
				page: {
					number: 5,
					size: 3
				}
			}
		};
		const pages = pagination(request);

		it('should convert the page number to an offset for the \'start\' property of the \'limits\' object', () => assert.strictEqual(pages.limits.start, 12));
		it('should use the \'size\' for the \'count\' property of the \'limits\' object', () => assert.strictEqual(pages.limits.count, 3));
		// TODO: 0 and negative offsets;
	});

	describe('Conflicting Pagination', () => {
		const request = {
			...baseMockRequest,
			query: {
				page: {
					offset: 7,
					number: 3,
					size: 4
				}
			}
		};

		const pages = pagination(request);

		it('should choose the offset over page number', () => assert.strictEqual(pages.limits.start, 7));
		it('should use the \'size\' for the \'count\' property of the \'limits\' object', () => assert.strictEqual(pages.limits.count, 4));
	});

	describe('getLinks function', () => {
		it('should preserve non-page related querystring params', () => {
			const request = {
				...baseMockRequest,
				query: {
					foo: 'bar',
					abc: 'def'
				}
			};

			const links = pagination(request).getLinks(11);

			return assert.strictEqual(links.last, `/pagination_test?foo=bar&abc=def&${encodeURIComponent('page[number]')}=2`);
		});

		describe('Page-based', () => {
			describe('First of two pages', () => {
				const request = {
					...baseMockRequest,
					query: {
						page: {
							size: 3,
						}
					}
				};

				const links = pagination(request).getLinks(4);
				const expected = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[number]')}=2`;

				it('should only return a link for next and last page', () => assert.deepStrictEqual(Object.keys(links), ['next', 'last']));
				it('should return a link for the next page', () => assert.strictEqual(links.next, expected));
				it('should return a link for the last page', () => assert.strictEqual(links.last, expected));
			});

			describe('Second of two pages', () => {
				const request = {
					...baseMockRequest,
					query: {
						page: {
							size: 3,
							number: 2
						}
					}
				};

				const links = pagination(request).getLinks(4);
				const expected = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[number]')}=1`;

				it('should only return a link for first and previous page', () => assert.deepStrictEqual(Object.keys(links), ['first', 'prev']));
				it('should return a link for the first page', () => assert.strictEqual(links.first, expected));
				it('should return a link for the previous page', () => assert.strictEqual(links.prev, expected));
			});

			describe('First of many pages', () => {
				const request = {
					...baseMockRequest,
					query: {
						page: {
							size: 3
						}
					}
				};

				const links = pagination(request).getLinks(15);
				const expectedNext = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[number]')}=2`;
				const expectedLast = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[number]')}=5`;

				it('should only return a link for next and last page', () => assert.deepStrictEqual(Object.keys(links), ['next', 'last']));
				it('should return a link for the next page', () => assert.strictEqual(links.next, expectedNext));
				it('should return a link for the last page', () => assert.strictEqual(links.last, expectedLast));
			});

			describe('Second page of many pages', () => {
				const request = {
					...baseMockRequest,
					query: {
						page: {
							size: 3,
							number: 2
						}
					}
				};

				const links = pagination(request).getLinks(15);
				const expectedFirst = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[number]')}=1`;
				const expectedPrev = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[number]')}=1`;
				const expectedNext = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[number]')}=3`;
				const expectedLast = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[number]')}=5`;

				it('should return a first, previous, next and last page', () => assert.deepStrictEqual(Object.keys(links), ['first', 'prev', 'next', 'last']));
				it('should return a link for the first page', () => assert.strictEqual(links.first, expectedFirst));
				it('should return a link for the prev page', () => assert.strictEqual(links.prev, expectedPrev));
				it('should return a link for the next page', () => assert.strictEqual(links.next, expectedNext));
				it('should return a link for the last page', () => assert.strictEqual(links.last, expectedLast));
			});

			describe('Middle page of many pages', () => {
				const request = {
					...baseMockRequest,
					query: {
						page: {
							size: 3,
							number: 3
						}
					}
				};

				const links = pagination(request).getLinks(15);
				const expectedFirst = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[number]')}=1`;
				const expectedPrev = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[number]')}=2`;
				const expectedNext = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[number]')}=4`;
				const expectedLast = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[number]')}=5`;

				it('should return a first, previous, next and last page', () => assert.deepStrictEqual(Object.keys(links), ['first', 'prev', 'next', 'last']));
				it('should return a link for the first page', () => assert.strictEqual(links.first, expectedFirst));
				it('should return a link for the prev page', () => assert.strictEqual(links.prev, expectedPrev));
				it('should return a link for the next page', () => assert.strictEqual(links.next, expectedNext));
				it('should return a link for the last page', () => assert.strictEqual(links.last, expectedLast));
			});

			describe('Second-last page of many pages', () => {
				const request = {
					...baseMockRequest,
					query: {
						page: {
							size: 3,
							number: 4
						}
					}
				};

				const links = pagination(request).getLinks(15);
				const expectedFirst = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[number]')}=1`;
				const expectedPrev = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[number]')}=3`;
				const expectedNext = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[number]')}=5`;
				const expectedLast = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[number]')}=5`;

				it('should return a first, previous, next and last page', () => assert.deepStrictEqual(Object.keys(links), ['first', 'prev', 'next', 'last']));
				it('should return a link for the first page', () => assert.strictEqual(links.first, expectedFirst));
				it('should return a link for the prev page', () => assert.strictEqual(links.prev, expectedPrev));
				it('should return a link for the next page', () => assert.strictEqual(links.next, expectedNext));
				it('should return a link for the last page', () => assert.strictEqual(links.last, expectedLast));
			});

			describe('Last of many pages', () => {
				const request = {
					...baseMockRequest,
					query: {
						page: {
							size: 3,
							number: 5
						}
					}
				};

				const links = pagination(request).getLinks(15);
				const expectedFirst = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[number]')}=1`;
				const expectedPrev = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[number]')}=4`;

				it('should return a first and previous', () => assert.deepStrictEqual(Object.keys(links), ['first', 'prev']));
				it('should return a link for the first page', () => assert.strictEqual(links.first, expectedFirst));
				it('should return a link for the prev page', () => assert.strictEqual(links.prev, expectedPrev));
			});

			describe('Out-of-range page', () => {
				const request = {
					...baseMockRequest,
					query: {
						page: {
							size: 3,
							number: 6
						}
					}
				};

				const links = pagination(request).getLinks(15);
				const expectedFirst = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[number]')}=1`;
				const expectedPrev = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[number]')}=5`;
				const expectedLast = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[number]')}=5`;

				it('should return a first, previous, next and last page', () => assert.deepStrictEqual(Object.keys(links), ['first', 'prev', 'last']));
				it('should return a link for the first page', () => assert.strictEqual(links.first, expectedFirst));
				it('should return a link for the prev page', () => assert.strictEqual(links.prev, expectedPrev));
				it('should return a link for the last page', () => assert.strictEqual(links.last, expectedLast));
			});
		});

		describe('Offset-based', () => {
			describe('Second of two pages', () => {
				const request = {
					...baseMockRequest,
					query: {
						page: {
							size: 3,
							offset: 3
						}
					}
				};

				const links = pagination(request).getLinks(6);
				const expected = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=0`;

				it('should only return a link for first and previous page', () => assert.deepStrictEqual(Object.keys(links), ['first', 'prev']));
				it('should return a link for the first page', () => assert.strictEqual(links.first, expected));
				it('should return a link for the previous page', () => assert.strictEqual(links.prev, expected));
			});

			describe('Offset between 0 and page size', () => {
				const request = {
					...baseMockRequest,
					query: {
						page: {
							size: 3,
							offset: 1
						}
					}
				};

				const links = pagination(request).getLinks(6);
				const expectedFirst = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=0`;
				const expectedNext = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=4`;
				const expectedLast = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=3`;

				it('should return a link for first, previous, next and last page', () => assert.deepStrictEqual(Object.keys(links), ['first', 'next', 'last']));
				it('should return a link for the first page', () => assert.strictEqual(links.first, expectedFirst));
				it('should return a link for the next page', () => assert.strictEqual(links.next, expectedNext));
				it('should return a link for the last page', () => assert.strictEqual(links.last, expectedLast));
			});

			describe('Offset between (Number of results - page size) and number of results', () => {
				const request = {
					...baseMockRequest,
					query: {
						page: {
							size: 3,
							offset: 4
						}
					}
				};

				const links = pagination(request).getLinks(6);
				const expectedFirst = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=0`;
				const expectedPrev = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=1`;

				it('should only return a link for first and previous page', () => assert.deepStrictEqual(Object.keys(links), ['first', 'prev']));
				it('should return a link for the first page', () => assert.strictEqual(links.first, expectedFirst));
				it('should return a link for the previous page', () => assert.strictEqual(links.prev, expectedPrev));
			});

			describe('Offset is higher than number of results', () => {
				const request = {
					...baseMockRequest,
					query: {
						page: {
							size: 3,
							offset: 7
						}
					}
				};

				const links = pagination(request).getLinks(6);
				const expectedFirst = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=0`;
				const expectedPrev = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=3`;
				const expectedLast = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=3`;

				it('should only return a link for first and previous page', () => assert.deepStrictEqual(Object.keys(links), ['first', 'prev', 'last']));
				it('should return a link for the first page', () => assert.strictEqual(links.first, expectedFirst));
				it('should return a link for the previous page', () => assert.strictEqual(links.prev, expectedPrev));
				it('should return a link for the last page', () => assert.strictEqual(links.last, expectedLast));
			});

			describe('Second page of many pages', () => {
				const request = {
					...baseMockRequest,
					query: {
						page: {
							size: 3,
							offset: 3
						}
					}
				};

				const links = pagination(request).getLinks(15);
				const expectedFirst = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=0`;
				const expectedPrev = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=0`;
				const expectedNext = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=6`;
				const expectedLast = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=12`;

				it('should return a first, previous, next and last page', () => assert.deepStrictEqual(Object.keys(links), ['first', 'prev', 'next', 'last']));
				it('should return a link for the first page', () => assert.strictEqual(links.first, expectedFirst));
				it('should return a link for the prev page', () => assert.strictEqual(links.prev, expectedPrev));
				it('should return a link for the next page', () => assert.strictEqual(links.next, expectedNext));
				it('should return a link for the last page', () => assert.strictEqual(links.last, expectedLast));
			});

			describe('Middle page of many pages', () => {
				const request = {
					...baseMockRequest,
					query: {
						page: {
							size: 3,
							offset: 6
						}
					}
				};

				const links = pagination(request).getLinks(15);
				const expectedFirst = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=0`;
				const expectedPrev = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=3`;
				const expectedNext = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=9`;
				const expectedLast = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=12`;

				it('should return a first, previous, next and last page', () => assert.deepStrictEqual(Object.keys(links), ['first', 'prev', 'next', 'last']));
				it('should return a link for the first page', () => assert.strictEqual(links.first, expectedFirst));
				it('should return a link for the prev page', () => assert.strictEqual(links.prev, expectedPrev));
				it('should return a link for the next page', () => assert.strictEqual(links.next, expectedNext));
				it('should return a link for the last page', () => assert.strictEqual(links.last, expectedLast));
			});

			describe('Second-last page of many pages', () => {
				const request = {
					...baseMockRequest,
					query: {
						page: {
							size: 3,
							offset: 9
						}
					}
				};

				const links = pagination(request).getLinks(15);
				const expectedFirst = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=0`;
				const expectedPrev = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=6`;
				const expectedNext = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=12`;
				const expectedLast = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=12`;

				it('should return a first, previous, next and last page', () => assert.deepStrictEqual(Object.keys(links), ['first', 'prev', 'next', 'last']));
				it('should return a link for the first page', () => assert.strictEqual(links.first, expectedFirst));
				it('should return a link for the prev page', () => assert.strictEqual(links.prev, expectedPrev));
				it('should return a link for the next page', () => assert.strictEqual(links.next, expectedNext));
				it('should return a link for the last page', () => assert.strictEqual(links.last, expectedLast));
			});

			describe('Last of many pages', () => {
				const request = {
					...baseMockRequest,
					query: {
						page: {
							size: 3,
							offset: 12
						}
					}
				};

				const links = pagination(request).getLinks(15);
				const expectedFirst = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=0`;
				const expectedPrev = `/pagination_test?${encodeURIComponent('page[size]')}=3&${encodeURIComponent('page[offset]')}=9`;

				it('should return a first and previous', () => assert.deepStrictEqual(Object.keys(links), ['first', 'prev']));
				it('should return a link for the first page', () => assert.strictEqual(links.first, expectedFirst));
				it('should return a link for the prev page', () => assert.strictEqual(links.prev, expectedPrev));
			});
		});
	});
});
