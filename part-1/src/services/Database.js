import mongodb from 'mongodb'

export default class Database{
    _client;

    constructor(connectionString){
        this._client = new mongodb.MongoClient(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    }

    openConnection = () => {
        return new Promise((resolve, reject) => {
            if(!this._client.isConnected()){
                this._client.connect().then(() => {
                    resolve(true);
                }).catch(err => {
                    reject(err);
                });
            }else{
                resolve(true);
            }
        })
    }

    closeConnection = () => {
        return new Promise(async (resolve, reject) => {
            if(this._client.isConnected()){
                try {
                    await this._client.close();
                    resolve(true);
                }catch(err) {
                    reject(err)
                }
            }else{
                resolve(true);
            }
        })
    }

    checkAllCollections = () => {
        return new Promise(async (resolve, reject) => {
            this._client.db().listCollections({}).toArray().then(array => {
                resolve(array);
            }).catch(async err => {
                reject(err);
            });

        })
    }

    getCollection = (collectionName) => {
        return new Promise(async (resolve, reject) => {
            if(!this._client.isConnected()){
                try{
                    await this._client.connect();
                }catch(err){
                    reject(err);
                }
            }

            const collection = this._client.db().collection(collectionName);
            resolve(collection);
        })
    }

    createCollection = (collectionName, options) => {
        return new Promise(async (resolve, reject) => {
            this._client.db().createCollection(collectionName, options).then(result => {
                resolve(result);
            }).catch(async err => {
                reject(err);
            });
        })
    }

    dropCollection = (collectionName) => {
        return new Promise((resolve, reject) => {
            this._client.db().collection(collectionName).drop().then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            });
        });
    }

    dropDatabase = (databaseName) => {
        return new Promise((resolve, reject) => {
            this._client.db().dropDatabase(databaseName).then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            });
        });
    }

    bulkWrite = (collectionName, operations) => {
        return new Promise(async (resolve, reject) => {
            if(!this._client.isConnected()){
                try{
                    await this._client.connect();
                }catch(err){
                    reject(err);
                }
            }

            this._client.db().collection(collectionName).bulkWrite(operations).then(result => {
                resolve(result);
            }).catch(async err => {
                reject(err);
            });
        });
    }

    query = (collectionName, filter, options) => {
        let projectionObject = {};

        if(options){
            if(options.projection){
                projectionObject = {projection : options.projection};
            }
        }

        return new Promise(async (resolve, reject) => {
            if(filter){
                if(filter._id){
                    const idString = filter._id;
                    const idAsObjectId = new mongodb.ObjectId(idString);

                    filter._id = idAsObjectId;
                }
            }

            try{
                let results = this._client.db().collection(collectionName).find(filter, projectionObject);

                if(options){
                    if(options.sort){
                        results = results.sort(options.sort);
                    }
                    if(options.limit){
                        results = results.limit(options.limit);
                    }
                }

                const resultsArray = await results.toArray();
                resolve(resultsArray);
            }catch(err){
                reject(err);
            }
        });
    }

    distinctQuery = (collectionName, keyFieldName, queryFields) => {
        return new Promise(async (resolve, reject) => {
            if(!this._client.isConnected()){
                try{
                    await this._client.connect();
                }catch(err){
                    reject(err);
                }
            }


            this._client.db().collection(collectionName).distinct(keyFieldName, queryFields).then(async results => {
                resolve(results);
            }).catch(err => {
                reject(err);
            });
        });
    }

    insertOne = (collectionName, document) => {
        return new Promise(async (resolve, reject) => {
            this._client.db().collection(collectionName).insertOne(document).then(result => {
                resolve(result);
            }).catch(async err => {
                reject(err);
            });
        })
    }

    updateOne = (collectionName, filter, updateObject) => {
        return new Promise(async (resolve, reject) => {
            if(!this._client.isConnected()){
                try{
                    await this._client.connect();
                }catch(err){
                    reject(err);
                }
            }

            this._client.db().collection(collectionName).updateOne(filter, {$set : updateObject}).then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            });
        });
    }

    findOneAndUpdate = (collectionName, filter, updateObject, options) => {
        return new Promise(async (resolve, reject) => {
            if(!this._client.isConnected()){
                try{
                    await this._client.connect();
                }catch(err){
                    reject(err);
                }
            }

            if(filter._id){
                const idString = filter._id;
                const idAsObjectId = new mongodb.ObjectId(idString);

                filter._id = idAsObjectId;
            }

            console.log(options);

            this._client.db().collection(collectionName).findOneAndUpdate(filter, {$set : updateObject}, options).then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            });
        });
    }

    deleteOne = (collectionName, filter) => {
        return new Promise(async (resolve, reject) => {
            if(!this._client.isConnected()){
                try{
                    await this._client.connect();
                }catch(err){
                    reject(err);
                }
            }

            this._client.db().collection(collectionName).deleteOne(filter).then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            });
        });
    }

    findOneAndDelete = (collectionName, filter) => {
        return new Promise(async (resolve, reject) => {
            if(!this._client.isConnected()){
                try{
                    await this._client.connect();
                }catch(err){
                    reject(err);
                }
            }

            if(filter._id){
                const idString = filter._id;
                const idAsObjectId = new mongodb.ObjectId(idString);

                filter._id = idAsObjectId;
            }

            this._client.db().collection(collectionName).findOneAndDelete(filter).then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            });
        });
    }

    createIndex = (collectionName, fieldsToIndex, options) => {
        return new Promise((resolve, reject) => {
            this._client.db().collection(collectionName).createIndex(fieldsToIndex, options).then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            });
        });
    }

    dropIndex = (indexName) => {
        return new Promise((resolve, reject) => {
            this._client.db().collection(collectionName).dropIndex(indexName).then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            });
        });
    }

    indexesInformation = (collectionName, options) => {
        return new Promise((resolve, reject) => {
            this._client.db().collection(collectionName).indexInformation(options).then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            });
        });
    }
}