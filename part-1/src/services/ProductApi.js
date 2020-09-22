import Database from "./Database.js";
import HttpError from "../models/HttpError.js";

export default class ProductApi{
    _database; //Instância da classe Database
    _collectionName;

    constructor(databaseInstance){
        this._database = databaseInstance;
        this._collectionName = "request";
    }

    prepareDatabaseForApi = () => {
        return new Promise(async  (resolve, reject) => {
            const environment = process.env.NODEJS_APP_ENVIRONMENT === "production" ? process.env.NODEJS_APP_ENVIRONMENT : "development";
            const collectionName = "request";
            const requiredFieldNames = ["requestHash", "requestDate"];
            const collectionSchema = {
                validator: {
                    $jsonSchema: {
                        bsonType: "object",
                        required: requiredFieldNames,
                        properties: {
                            requestHash: {
                                bsonType: "string",
                                description: "Hash alfanumérica da requisição, composta por diversas informações como IP, tipo MIME do body, quantidade de bytes do body etc."
                            },
                            requestDate: {
                                bsonType: "date",
                                description: "Data da requisição. Utilizada em conjunto com um índice TTL a fim de bloquear requisições repetidas em um curto espaço de tempo."
                            }
                        }
                    }
                }
            }
            const fieldNameToIndex = "requestDate";
            const ordering = "ASC";
            const fieldObjectToIndex = {
                [fieldNameToIndex] : ordering === "ASC" ? 1 : -1
            };
            const indexOptions = {
                expireAfterSeconds: 600
            }

            let currentDatabaseName = await this._database.getCurrentDatabaseName();

            //Valida o banco vigente para utilização.
            //Se o ambiente não houver sido declarado como produção, utilize o sufixo -test no banco de dados utilizado
            if(environment !== "production"){
                let newDatabaseName;

                if(currentDatabaseName === "test"){
                    newDatabaseName = databaseName + "-test";
                }else{
                    newDatabaseName = currentDatabaseName + "-test";
                }

                try{
                    await this._database.useDatabase(newDatabaseName);
                }catch(err){
                    reject(new Error("Erro ao preparar a API para inicialização!\n" + err.message));
                }
            }else{
                if(currentDatabaseName === "test"){
                    try{
                        await this._database.useDatabase(databaseName);
                    }catch(err){
                        reject(new Error("Erro ao preparar a API para inicialização!\n" + err.message));
                    }
                }
            }
            //**************************************

            //Verifica se a collection existe, e a cria caso seja necessário
            let collectionList;

            try{
                collectionList = await this._database.checkAllCollections();
            }catch(err){
                reject(new Error("Erro ao preparar a API para inicialização!\n" + err.message));
            }

            let found = collectionList.find(element => element.name === collectionName && element.type === "collection");

            if(!found){
                try{
                    await this._database.createCollection(collectionName, collectionSchema);
                }catch(err){
                    reject(new Error("Erro ao preparar a API para inicialização!\n" + err.message));
                }
            }
            //**************************************

            //Verifica se existe algum índice no campo requestDate
            let indexList;

            try{
                indexList = await this._database.indexesInformation(collectionName, {full : true});
            }catch(err){
                reject(new Error("Erro ao preparar a API para inicialização!\n" + err.message));
            }

            if(!(indexList instanceof Array)){
                reject(new Error("Erro ao preparar a API para inicialização! Erro ao listar índices!"));
            }

            let index = indexList.find(element => {
                return element.key[fieldObjectToIndex];
            });
            //**************************************

            //Se não houver índice TTL de 10 minutos, tome as ações necessárias para que ele seja criado
            if(index){
                if(index.expireAfterSeconds){
                    if(index.expireAfterSeconds !== indexOptions.expireAfterSeconds){
                        try{
                            await this._database.dropIndex(collectionName, index.name);
                            await this._database.createIndex(collectionName, fieldObjectToIndex, indexOptions);
                        }catch(err){
                            reject(new Error("Erro ao preparar a API para inicialização!\n" + err.message));
                        }
                    }
                }else{
                    try{
                        await this._database.dropIndex(collectionName, index.name);
                        await this._database.createIndex(collectionName, fieldObjectToIndex, indexOptions);
                    }catch(err){
                        reject(new Error("Erro ao preparar a API para inicialização!\n" + err.message));
                    }
                }
            }else{
                try{
                    await this._database.createIndex(collectionName, fieldObjectToIndex, indexOptions);
                }catch(err){
                    reject(new Error("Erro ao preparar a API para inicialização!\n" + err.message));
                }
            }
            //**************************************
            resolve(true);
        });
    }

    resetApi = (req, res) => {
        return new Promise(async (resolve, reject) => {
            const environment = process.env.NODEJS_APP_ENVIRONMENT === "production" ? process.env.NODEJS_APP_ENVIRONMENT : "development";

            if(environment === "production"){
                this.errorHandler(res, new HttpError("Operação proibida em ambiente de produção!", 403));
                return;
            }

            const collectionName = "request";
            const requiredFieldNames = ["requestHash", "requestDate"];
            const collectionSchema = {
                validator: {
                    $jsonSchema: {
                        bsonType: "object",
                        required: requiredFieldNames,
                        properties: {
                            requestHash: {
                                bsonType: "string",
                                description: "Hash alfanumérica da requisição, composta por diversas informações como IP, tipo MIME do body, quantidade de bytes do body etc."
                            },
                            requestDate: {
                                bsonType: "date",
                                description: "Data da requisição. Utilizada em conjunto com um índice TTL a fim de bloquear requisições repetidas em um curto espaço de tempo."
                            }
                        }
                    }
                }
            }
            const fieldNameToIndex = "requestDate";
            const ordering = "ASC";
            const fieldObjectToIndex = {
                [fieldNameToIndex] : ordering === "ASC" ? 1 : -1
            };
            const indexOptions = {
                expireAfterSeconds: 600
            }

            let currentDatabaseName = await this._database.getCurrentDatabaseName();

            //Valida o banco vigente para utilização.
            //Utiliza o sufixo -test no banco de dados utilizado
            let newDatabaseName = currentDatabaseName;

            if(currentDatabaseName === "test"){
                newDatabaseName = databaseName + "-test";
            }else{
                if(!currentDatabaseName.includes("-test")){
                    newDatabaseName = currentDatabaseName + "-test";
                }
            }

            try{
                await this._database.useDatabase(newDatabaseName);
            }catch(err){
                console.log(err.message);
                this.errorHandler(res, new HttpError("Erro ao preparar API para reinicialização!"));
                return;
            }
            //**************************************

            //Recria a collection
            let collectionList;

            try{
                collectionList = await this._database.checkAllCollections();
            }catch(err){
                console.log(err.message);
                this.errorHandler(res, new HttpError("Erro ao preparar API para reinicialização!"));
                return;
            }

            let found = collectionList.find(element => element.name === collectionName && element.type === "collection");

            if(found){
                try{
                    await this._database.dropCollection(collectionName);
                }catch(err){
                    console.log(err.message);
                    this.errorHandler(res, new HttpError("Erro ao preparar API para reinicialização!"));
                    return;
                }
            }

            try{
                await this._database.createCollection(collectionName, collectionSchema);
            }catch(err){
                console.log(err.message);
                this.errorHandler(res, new HttpError("Erro ao preparar API para reinicialização!"));
                return;
            }
            //**************************************

            //Cria o índice TTL
            try{
                await this._database.createIndex(collectionName, fieldObjectToIndex, indexOptions);
            }catch(err){
                console.log(err.message);
                this.errorHandler(res, new HttpError("Erro ao preparar API para reinicialização!"));
                return;
            }
            //**************************************

            let responseBody = {
                success : true,
                message : "Reinicialização da API realizada com sucesso!"
            }

            res.writeHead(200, {
                "Content-Type": "application/json",
                "Content-Length": Buffer.from(JSON.stringify(responseBody)).length
            });

            res.end(JSON.stringify(responseBody));
        });
    }

    updateProductsInformation = (req, res) => {
        return new Promise(async (resolve, reject) => {
            let alphaHash = "";

            try{
                alphaHash = this.generateAlphaHash(req);
            }catch(err){
                console.log(err.message);
                this.errorHandler(res, new HttpError(err.message));
                return
            }

            try{
                let repeatedRequest = await this._isAlphaHashInDatabase(alphaHash);

                if(repeatedRequest){
                    let errorMessage = "Requisições repetidas não são permitidas em um intervalo de 10 minutos!";
                    this.errorHandler(res, new HttpError(errorMessage, 403));
                    return
                }
            }catch(err){
                console.log(err.message);
                this.errorHandler(res, new HttpError(err.message));
                return
            }

            try{
                let insertResult = await this._database.insertOne(this._collectionName, this._getAlphaDocument(req, alphaHash));
            }catch(err){
                this.errorHandler(res, new HttpError(err.message));
                return
            }

            //Endpoint atualiza os dados do produto conforme enunciado do desafio

            let responseBody = {
                success : true,
                message : "Atualização de informações do produto realizada com sucesso!"
            }

            res.writeHead(200, {
                "Content-Type": "application/json",
                "Content-Length": Buffer.from(JSON.stringify(responseBody)).length
            });

            res.end(JSON.stringify(responseBody));
        });
    }

    errorHandler = (res, httpError) => {
        let responseBody = {
            success : false,
            message : httpError.message
        }

        res.writeHead(httpError.getErrorCode(), {
            "Content-Type": "application/json",
            "Content-Length": Buffer.from(JSON.stringify(responseBody)).length
        });

        res.end(JSON.stringify(responseBody));
    }


    generateAlphaHash = (req) => {
        let validationObject = this.validRequestForAlphaHash(req);

        if(!validationObject.valid){
            throw new Error(validationObject.errorMessage);
        }

        let host = req.headers.host; //localhost:3000
        let contentTypeMime = req.headers["content-type"]; //"application/json"
        let contentLength = Buffer.byteLength(req.body); //56
        let endpoint = req.url; // /v1/products
        let httpVerb = req.method; //POST
        let bodyAsByteArray = req.body;

        let alphaHash = "";

        let digits = 0;

        // [...Buffer.from(variavel)] Gera a sequência de bytes a partir de uma string, e logo em seguida transforma em array
        for(let byte of [...Buffer.from(host)]){
            let alphaDigit = byte.toString(16);

            if(alphaDigit.length === 1){
                alphaDigit = "0" + alphaDigit;
            }

            alphaHash += alphaDigit;
            digits += 2;
        }

        while(digits  < 40){
            alphaHash += (255).toString(16);
            digits += 2;
        }


        for(let byte of [...Buffer.from(contentTypeMime)]){
            let alphaDigit = byte.toString(16);

            if(alphaDigit.length === 1){
                alphaDigit = "a" + alphaDigit;
            }

            alphaHash += alphaDigit;
            digits += 2;
        }

        while(digits  < 80){
            alphaHash += (255).toString(16);
            digits += 2;
        }

        let contentLengthAsAlphaString = contentLength.toString(16);

        while(contentLengthAsAlphaString.length < 16){
            contentLengthAsAlphaString += "x";
        }

        alphaHash += contentLengthAsAlphaString;
        digits += 16;

        for(let byte of [...Buffer.from(endpoint)]){
            let alphaDigit = byte.toString(16);

            if(alphaDigit.length === 1){
                alphaDigit = "b" + alphaDigit;
            }

            alphaHash += alphaDigit;
            digits += 2;
        }

        while(digits  < 136){
            alphaHash += (255).toString(16);
            digits += 2;
        }

        for(let byte of [...Buffer.from(httpVerb)]){
            let alphaDigit = byte.toString(16);

            if(alphaDigit.length === 1){
                alphaDigit = "c" + alphaDigit;
            }

            alphaHash += alphaDigit;
            digits += 2;
        }

        while(digits  < 150){
            alphaHash += (255).toString(16);
            digits += 2;
        }

        if(bodyAsByteArray.length < 12){
            for(let byte of bodyAsByteArray){
                let alphaDigit = byte.toString(16);

                if(alphaDigit.length === 1){
                    alphaDigit = "9" + alphaDigit;
                }

                alphaHash += alphaDigit;
                digits += 2;
            }

            while(digits  < 172){
                alphaHash += (240).toString(16);
                digits += 2;
            }
        }else{
            let maxIndex = bodyAsByteArray.length - 1;
            let middleIndex = parseInt(maxIndex / 2);
            let alphaDigit = "";

            alphaDigit = bodyAsByteArray[0].toString(16);
            if(alphaDigit.length === 1){
                alphaDigit = "0" + alphaDigit;
            }
            alphaHash += alphaDigit;

            alphaDigit = bodyAsByteArray[1].toString(16);
            if(alphaDigit.length === 1){
                alphaDigit = "9" + alphaDigit;
            }
            alphaHash += alphaDigit;

            alphaDigit = bodyAsByteArray[2].toString(16);
            if(alphaDigit.length === 1){
                alphaDigit = "f" + alphaDigit;
            }
            alphaHash += alphaDigit;

            alphaDigit = bodyAsByteArray[3].toString(16);
            if(alphaDigit.length === 1){
                alphaDigit = "c" + alphaDigit;
            }
            alphaHash += alphaDigit;

            alphaDigit = bodyAsByteArray[middleIndex - 1].toString(16);
            if(alphaDigit.length === 1){
                alphaDigit = "d" + alphaDigit;
            }
            alphaHash += alphaDigit;

            alphaDigit = bodyAsByteArray[middleIndex].toString(16);
            if(alphaDigit.length === 1){
                alphaDigit = "e" + alphaDigit;
            }
            alphaHash += alphaDigit;

            alphaDigit = bodyAsByteArray[middleIndex + 1].toString(16);
            if(alphaDigit.length === 1){
                alphaDigit = "2" + alphaDigit;
            }
            alphaHash += alphaDigit;

            alphaDigit = bodyAsByteArray[maxIndex].toString(16);
            if(alphaDigit.length === 1){
                alphaDigit = "3" + alphaDigit;
            }
            alphaHash += alphaDigit;

            alphaDigit = bodyAsByteArray[maxIndex - 1].toString(16);
            if(alphaDigit.length === 1){
                alphaDigit = "4" + alphaDigit;
            }
            alphaHash += alphaDigit;

            alphaDigit = bodyAsByteArray[maxIndex - 2].toString(16);
            if(alphaDigit.length === 1){
                alphaDigit = "3" + alphaDigit;
            }
            alphaHash += alphaDigit;

            alphaDigit = bodyAsByteArray[maxIndex - 3].toString(16);
            if(alphaDigit.length === 1){
                alphaDigit = "2" + alphaDigit;
            }
            alphaHash += alphaDigit;

            digits += 11;
        }

        return alphaHash;
    }

    _isAlphaHashInDatabase = (alphaHash) => {
        return new Promise(async (resolve,reject) => {
            let alphaList = [];
            let queryFilter = {
              requestHash: alphaHash
            };

            try{
                alphaList = await this._database.query(this._collectionName, queryFilter);
            }catch(err){
                reject(err);
            }

            if(alphaList.length === 0){
                resolve(false);
            }else{
                resolve(true);
            }
        });
    }

    _getAlphaDocument = (req, alphaHash) => {
        let host = req.headers.host; //localhost:3000
        let contentTypeMime = req.headers["content-type"]; //"application/json"
        let contentLength = Buffer.byteLength(req.body); //56
        let endpoint = req.url; // /v1/products
        let httpVerb = req.method; //POST

        let document = {
            host,
            contentTypeMime,
            contentLength,
            endpoint,
            httpVerb,
            requestHash: alphaHash,
            requestDate: new Date()
        }

        return document;
    }

    validRequestForAlphaHash = (req) => {
        let valid = true;
        let errorCount = 0;
        let errorMessage = "";

        let host = req.headers.host;
        let contentTypeMime = req.headers["content-type"];
        let body = req.body;
        let contentLength = body && (body instanceof Buffer) ? Buffer.byteLength(req.body) : undefined;
        let endpoint = req.url;
        let httpMethod = req.method;

        if(!host){
            if(!errorCount){
                errorMessage += "Um ou mais erros na requisição:\n"
            }

            errorMessage += "Host da requisição inexistente!";

            errorCount++;
        }

        if(!contentTypeMime){
            if(!errorCount){
                errorMessage += "Um ou mais erros na requisição:\n"
            }

            errorMessage += "Cabeçalho Content-Type inexistente!";

            errorCount++;
        }

        if(!body){
            if(!errorCount){
                errorMessage += "Um ou mais erros na requisição:\n"
            }

            errorMessage += "Corpo da requisição inexistente!";

            errorCount++;
        }else if(!(body instanceof Buffer)){
            if(!errorCount){
                errorMessage += "Um ou mais erros na requisição:\n"
            }

            errorMessage += "Corpo da requisição não é uma sequência de bytes!";

            errorCount++;
        }

        if(!contentLength){
            if(!errorCount){
                errorMessage += "Um ou mais erros na requisição:\n"
            }

            errorMessage += "Cabeçalho Content-Length inexistente ou o corpo da requisição não é do tipo Buffer!";

            errorCount++;
        }

        if(!endpoint){
            if(!errorCount){
                errorMessage += "Um ou mais erros na requisição:\n"
            }

            errorMessage += "URL endpoint da requisição inexistente!";

            errorCount++;
        }

        if(!httpMethod){
            if(!errorCount){
                errorMessage += "Um ou mais erros na requisição:\n"
            }

            errorMessage += "Método HTTP da requisição inexistente!";

            errorCount++;
        }

        if(errorCount){
           valid = false;
        }


        return {
            valid,
            errorMessage
        };
    }
}
