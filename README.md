`doix-mongodb` is a plug in for the [doix](https://github.com/do-/node-doix) framework implementing an interface to [MongoDB](https://www.mongodb.com/).

# Usage
## Adding to the project
In your package.js:

```json
  "peerDependencies": {
...
    "doix-mongodb": "^1.0.6"
...
  },
```

Then,

```sh
npm i
```

## Declaring a Connection Pool at the [Application](https://github.com/do-/node-doix/wiki/Application) Level

```js
const MongoDB = require ('doix-mongodb')

module.exports = class extends Application {

  constructor (conf, logger) {				
    super ({
      logger,    
      pools: {
        mongo: new MongoDB ({...conf.mongodb, logger}),
        //...
      },
      //...
    },
    //...
  }
}
```

## Writing Data from a [Workflow](https://github.com/do-/node-doix?tab=readme-ov-file#the-workflow) Module

```js
await this.mongo.insertMany (collectionName, listOfDocuments)

await this.mongo.updateOne (collectionName, filter, singleDocument, options)

await this.mongo.bulkWrite (collectionName, listOfDocuments, options)

const documents = await (await mongo.find (collectionName, filter)).toArray () // sic: `await` bis
```

# Methods
## bulkWrite
For MongoDB 8+, a shortcut for the underlying driver's [`bulkWrite`](https://www.geeksforgeeks.org/node-js/mongoose-document-model-bulkwrite-api/). Otherwise, an emulation using [`Promise.all ()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all).


## insertMany
Shortcut for the underlying driver's [`insertMany`](https://github.com/mongodb/node-mongodb-native?tab=readme-ov-file#insert-a-document).

## find
Shortcut for the underlying driver's [`find`](https://github.com/mongodb/node-mongodb-native?tab=readme-ov-file#find-documents-with-a-query-filter).

Note: here, the `.find ()` method is asynchronous and so is its result's `.toArray ()`. So you need double `await` when using `.toArray ()` (see the example above).

## updateOne 
Shortcut for the underlying driver's [`updateOne`](https://github.com/mongodb/node-mongodb-native?tab=readme-ov-file#update-a-document).
