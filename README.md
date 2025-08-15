# doix-db-mongodb
`doix-db-mongodb` is a plug in for the [doix](https://github.com/do-/node-doix) framework implementing an interface to [MongoDB](https://www.mongodb.com/).

# Usage
## Declaring a Connection Pool at the [Application](https://github.com/do-/node-doix/wiki/Application) Level

```js
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
```

# Methods
## bulkWrite
For MongoDB 8+, a shortcut for the underlying driver's [`bulkWrite`](https://www.geeksforgeeks.org/node-js/mongoose-document-model-bulkwrite-api/). Otherwise, an emulation using [`Promise.all ()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all).

## insertMany
Shortcut for the underlying driver's [`insertMany`](https://github.com/mongodb/node-mongodb-native?tab=readme-ov-file#insert-a-document).

## updateOne 
Shortcut for the underlying driver's [`updateOne`](https://github.com/mongodb/node-mongodb-native?tab=readme-ov-file#update-a-document).
