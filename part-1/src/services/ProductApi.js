import Database from "./Database.js";
import HttpError from "../models/HttpError.js";

export default class ProductApi{
    _database; //Instância da classe Database
    _collectionName;

    constructor(databaseInstance){
        this._database = databaseInstance;
        this._collectionName = "request";
    }

    prepareDatabaseForApi = async () => {
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
                            description: "Hash hexadecimal da requisição, composta por diversas informações como IP, tipo MIME do body, quantidade de bytes do body etc."
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

        let collectionList;

        try{
            collectionList = await this._database.checkAllCollections();
        }catch(err){
            throw new Error("Erro ao preparar a API para inicialização!\n" + err.message);
        }

        let found = collectionList.find(element => element.name === collectionName && element.type === "collection");

        if(!found){
            try{
                await this._database.createCollection(collectionName, collectionSchema);
            }catch(err){
                throw new Error("Erro ao preparar a API para inicialização!\n" + err.message);
            }
        }

        let indexList;

        try{
            indexList = await this._database.indexesInformation(collectionName, {full : true});
        }catch(err){
            throw new Error("Erro ao preparar a API para inicialização!\n" + err.message);
        }

        if(!(indexList instanceof Array)){
            throw new Error("Erro ao preparar a API para inicialização! Erro ao listar índices!");
        }

        let index = indexList.find(element => {
            return element.key[fieldObjectToIndex];
        });

        //Se não houver índice TTL de 10 minutos, tome as ações necessárias para que ele seja criado
        if(index){
            if(index.expireAfterSeconds){
                if(index.expireAfterSeconds !== indexOptions.expireAfterSeconds){
                    try{
                        await this._database.dropIndex(collectionName, index.name);
                        await this._database.createIndex(collectionName, fieldObjectToIndex, indexOptions);
                    }catch(err){
                        throw new Error("Erro ao preparar a API para inicialização!\n" + err.message);
                    }
                }
            }else{
                try{
                    await this._database.dropIndex(collectionName, index.name);
                    await this._database.createIndex(collectionName, fieldObjectToIndex, indexOptions);
                }catch(err){
                    throw new Error("Erro ao preparar a API para inicialização!\n" + err.message);
                }
            }
        }else{
            try{
                await this._database.createIndex(collectionName, fieldObjectToIndex, indexOptions);
            }catch(err){
                throw new Error("Erro ao preparar a API para inicialização!\n" + err.message);
            }
        }
    }

    updateProductsInformation = (req, res) => {
        return new Promise(async (resolve, reject) => {
            let hexHash = "";

            try{
                hexHash = this._generateHexHash(req);
            }catch(err){
                console.log(err.message);
                this.errorHandler(res, new HttpError(err.message));
                return
            }

            try{
                let repeatedRequest = await this._isHexHashInDatabase(hexHash);

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
                let insertResult = await this._database.insertOne(this._collectionName, this._getHexDocument(req, hexHash));
            }catch(err){
                this.errorHandler(res, new HttpError(err.message));
                return
            }

            //Endpoint atualiza os dados do produto conforme enunciado do desafio

            let responseBody = {
                sucess : true,
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
            sucess : false,
            message : httpError.message
        }

        res.writeHead(httpError.getErrorCode(), {
            "Content-Type": "application/json",
            "Content-Length": Buffer.from(JSON.stringify(responseBody)).length
        });

        res.end(JSON.stringify(responseBody));
    }


    _generateHexHash = (req) => {
        let validationObject = this._validRequestForHexHash(req);

        if(!validationObject.valid){
            throw new Error(validationObject.errorMessage);
        }

        let host = req.headers.host; //localhost:3000
        let contentTypeMime = req.headers["content-type"]; //"application/json"
        let contentLength = Buffer.byteLength(req.body); //56
        let endpoint = req.url; // /v1/products
        let httpVerb = req.method; //POST
        let bodyAsByteArray = req.body;

        let hexHash = "";

        console.log(contentLength);

        // [...Buffer.from(variavel)] Gera a sequência de bytes a partir de uma string, e logo em seguida transforma em array
        for(let byte of [...Buffer.from(host)]){
            hexHash += byte.toString(16);
        }

        for(let byte of [...Buffer.from(contentTypeMime)]){
            hexHash += byte.toString(16);
        }

        hexHash += contentLength.toString(16);

        for(let byte of [...Buffer.from(endpoint)]){
            hexHash += byte.toString(16);
        }

        for(let byte of [...Buffer.from(httpVerb)]){
            hexHash += byte.toString(16);
        }

        if(bodyAsByteArray.length <= 12){
            for(let byte of bodyAsByteArray){
                hexHash += byte.toString(16);
            }
        }else{
            let maxIndex = bodyAsByteArray.length - 1;
            let middleIndex = parseInt(maxIndex / 2);

            hexHash += bodyAsByteArray[0].toString(16);
            hexHash += bodyAsByteArray[1].toString(16);
            hexHash += bodyAsByteArray[2].toString(16);
            hexHash += bodyAsByteArray[3].toString(16);

            hexHash += bodyAsByteArray[middleIndex - 1].toString(16);
            hexHash += bodyAsByteArray[middleIndex].toString(16);
            hexHash += bodyAsByteArray[middleIndex + 1].toString(16);

            hexHash += bodyAsByteArray[maxIndex].toString(16);
            hexHash += bodyAsByteArray[maxIndex - 1].toString(16);
            hexHash += bodyAsByteArray[maxIndex - 2].toString(16);
            hexHash += bodyAsByteArray[maxIndex - 3].toString(16);
        }

        return hexHash;
    }

    _isHexHashInDatabase = (hexHash) => {
        return new Promise(async (resolve,reject) => {
            let hexList = [];
            let queryFilter = {
              requestHash: hexHash
            };

            console.log(`Hash passada: ${hexHash}`)
            try{
                hexList = await this._database.query(this._collectionName, queryFilter);
            }catch(err){
                reject(err);
            }

            console.log(hexList);

            if(hexList.length === 0){
                resolve(false);
            }else{
                resolve(true);
            }
        });
    }

    _getHexDocument = (req, hexHash) => {
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
            requestHash:  hexHash,
            requestDate: new Date()
        }

        return document;
    }

    _validRequestForHexHash = (req) => {
        let valid = true;
        let errorCount = 0;
        let errorMessage = "";

        let host = req.headers.host;
        let contentTypeMime = req.headers["content-type"];
        let contentLength = Buffer.byteLength(req.body);
        let endpoint = req.url;
        let httpMethod = req.method;
        let body = req.body;

        console.log(contentLength);

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

        if(!contentLength){
            if(!errorCount){
                errorMessage += "Um ou mais erros na requisição:\n"
            }

            errorMessage += "Cabeçalho Content-Length inexistente!";

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

        if(errorCount){
           valid = false;
        }


        return {
            valid,
            errorMessage
        };
    }
}
