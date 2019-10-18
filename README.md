# jsonapi-pagination #

[![Build Status](https://travis-ci.org/StatCan/jsonapi-pagination.svg?branch=master)](https://travis-ci.org/StatCan/jsonapi-pagination)

A module for implementing page-based and/or offset-based pagination for JSONAPI.

## Getting Started ##

### Prerequisites ###

* Node >= 8

## Example ###

```js
const express = require('express');
const pagination = require('jsonapi-pagination');
const app = express();
const port = 8000;

app.get('/article', async (req, res) => {
  const pages = pagination(req);
  const {start, count} = pages.limits;

  // The abstract list function returns an object with the number of total results
  // and the subset of results.
  const {length, list} = await article.list(start, count);
  const links = pages.getLinks(length);

  res.json({
    links,
    data: list
  });
});

app.listen(port);
```

Here are a few sample requests (assuming 50 total articles).

```
$ curl http://localhost:8000/article?page[number]=3

{
  "links": {
    "first": "/article?page[number]=1",
    "prev": "/article?page[number]=2",
    "next": "/article?page[number]=4",
    "last": "/article?page[number]=5"
  },
  "data": [
    ...
  ]
}

$ curl http://localhost:8000/article?page[offset]=15

{
  "links": {
    "first": "/article?page[offset]=0",
    "prev": "/article?page[number]=5",
    "next": "/article?page[offset]=25",
    "last": "/article?page[offset]=40"
  },
  "data": [
    ...
  ]
}

$ curl http://localhost:8000/article?page[size]=20&page[number]=2

{
  "links": {
    "first": "/article?page[size]=20&page[number]=1",
    "prev": "/article?page[size]=20&page[number]=1",
    "next": "/article?page[size]=20&page[number]=3",
    "last": "/article?page[size]=20&page[number]=3"
  },
  "data": [
    ...
  ]
}
```

## License ##

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
