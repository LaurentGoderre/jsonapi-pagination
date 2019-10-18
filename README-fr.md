# jsonapi-pagination #

Un module pour implanter de la pagination basée sur les pages et/ou basée sur le décalage pour JSONAPI.

## Démarrage ##

### Prérequis ###

* Node >= 8

## Exemple ###

```js
const express = require('express');
const pagination = require('jsonapi-pagination');
const app = express();
const port = 8000;

app.get('/article', async (req, res) => {
  const pages = pagination(req);
  const {start, count} = pages.limits;

  // La fonction abstraite "list" retourne un objet contenant le nombre total de
  // résultats ainsi que le sous-ensemble de résultats.
  const {length, list} = await article.list(start, count);
  const links = pages.getLinks(length);

  res.json({
    links,
    data: list
  });
});

app.listen(port);
```

Voici quelques exemples de requêtes (en supposant un nombre total d'article de 50).

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

Ce project est sous licence MIT - voir le fichier [LICENSE-fr.md](LICENSE-fr.md) pour plus de détails.
