import Database from '../src/services/Database.js'
import loadEnvironmentVariablesIfAny from '../src/load_env.js'
import mocha from 'mocha';
import chai  from 'chai';

const describe = mocha.describe;
const it = mocha.it;
const expect = chai.expect;
const assert = chai.assert;

loadEnvironmentVariablesIfAny();

const environment = process.env.NODEJS_APP_ENVIRONMENT === "production" ? process.env.NODEJS_APP_ENVIRONMENT : "development";
const dbConnectionString = process.env.MONGODB_CONNSTRING;
const db = new Database(dbConnectionString);

const databaseName = "guilherme_calin_linx_desafio";
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

describe("Suite de testes do serviço de acesso ao banco de dados MongoDB, referente à classe Database", function(){
    let connectionOpened;

    describe("Checagem de variáveis de ambiente obrigatórias ", function(){
        it(`Variável de ambiente MONGODB_CONNSTRING deve existir no ambiente`, function(){
           if(!dbConnectionString){
               assert.fail("Variável não existe! Configure o ambiente e tente novamente.");
           }
        });
    });

    describe("Abertura de conexão ao banco de dados", function(){
        it("Abertura de conexão deve ser realizada com sucesso.", async function(){
            try{
                let conn = await db.openConnection();
                connectionOpened = true;
            }catch(err){
                connectionOpened = false;
                assert.fail("Erro na conexão com o banco de dados", "Sucesso na conexão", err.message);
            }
        });
    });

    describe("Validação do banco de dados vigente", async function(){
       it(`Caso não tenha sido informado o banco de dados na string de conexão,
       altere o banco de dados vigente para ${databaseName}.`, async function(){
           let currentDatabaseName = await db.getCurrentDatabaseName();

           if(environment !== "production"){
               let newDatabaseName;

               if(currentDatabaseName === "test"){
                   newDatabaseName = databaseName + "-test";
               }else{
                   newDatabaseName = currentDatabaseName + "-test";
               }

               try{
                   await db.useDatabase(newDatabaseName);
               }catch(err){
                   assert.fail(err.message);
               }
           }else{
               if(currentDatabaseName === "test"){
                   try{
                       await db.useDatabase(databaseName);
                   }catch(err){
                       assert.fail(err.message);
                   }
               }
           }
        });
    });

    describe("Listagem de collections", function(){
        before(async function(){
            if(!connectionOpened){
                assert.fail("Condição inicial do teste não foi cumprida! Erro ao conectar no banco de dados!");
            }
        });

        it("Deve trazer a lista de collections do banco conectado.", async function(){
            let collectionList;

            try{
                collectionList = await db.checkAllCollections();
            }catch(err){
                assert.fail("Erro ao listar collections!");
            }

            expect(collectionList).to.not.be.undefined;
            expect(collectionList).to.be.an('array');
        });
    });

    describe("Exclusão de collection", function(){
        let collectionExists;

        before(async function(){
            if(!connectionOpened){
                assert.fail("Condição inicial do teste não foi cumprida! Erro ao conectar no banco de dados!");
            }

            let collectionList;

            try{
                collectionList = await db.checkAllCollections();
            }catch(err){
                assert.fail("Condição inicial do teste não foi cumprida! Erro ao listar todas as coleções!");
            }

            expect(collectionList).to.be.an("array");

            let found = collectionList.find((element) => element.name === collectionName && element.type === "collection");

            found ? collectionExists = true : collectionExists = false;
        });

       it(`Deve excluir a collection ${collectionName} caso ela exista. Se a collection não existir, o teste é considerado aprovado.`, async function(){
           if(collectionExists){
               try{
                   await db.dropCollection(collectionName);
                   collectionExists = false;
               }catch(err){
                   assert.fail("Falha na exclusão de collection já existente");
               }
           }
       }) ;

       it(`Deve falhar em excluir a collection ${collectionName} caso ela não exista. Se a collection existir, o teste é considerado aprovado.`, async function(){
            if(!collectionExists){
                try{
                    await db.dropCollection(collectionName);
                    assert.fail("Exclusão de collection não existente deveria ter falhado!");
                }catch(err){}
            }
       });
    });

    describe("Criação de collection", function(){
        let collectionExists = false;
        let collectionList;

        before(async function(){
            if(!connectionOpened){
                assert.fail("Condição inicial do teste não foi cumprida! Erro ao conectar no banco de dados!");
            }

            try{
                collectionList = await db.checkAllCollections();
            }catch(err){
                assert.fail("Condição inicial do teste não foi cumprida! Erro ao listar todas as coleções!");
            }

            expect(collectionList).to.be.an("array");

            let found = collectionList.find((element) => element.name === collectionName && element.type === "collection");

            if(found){
                try{
                    await db.dropCollection(collectionName);
                }catch(err){
                    assert.fail("Condição inicial do teste não foi cumprida! Erro ao excluir uma collection!");
                }
            }
        });

        it(`Deve criar a collection ${collectionName} caso ela não exista.`, async function(){
            let createResult;

            try{
                createResult = await db.createCollection(collectionName, collectionSchema);
            }catch(err){
                assert.fail("Erro ao inserir collection " + collectionName);
            }

            expect(createResult).not.to.be.undefined;
            expect(createResult).not.to.be.null;

            try{
                collectionList = await db.checkAllCollections();
            }catch(err){
                assert.fail("Erro ao listar collections", "Sucesso ao listar collections", err.message);
            }

            expect(collectionList).to.not.be.undefined;
            expect(collectionList).to.be.an('array');
            expect(collectionList.length).to.be.greaterThan(0);

            let found = collectionList.find((element) => element.name === collectionName && element.type === "collection");

            expect(found).not.to.be.undefined;

            collectionExists = true;
        });

        it(`Deve falhar em criar a collection ${collectionName} caso ela já exista.`, async function(){
            if(collectionExists){
                try{
                    let createResult = await db.createCollection(collectionName, collectionSchema);
                    assert.fail("Não deveria haver sucesso na criação de uma collection já existente!");
                }catch(err){}
            }else{
                assert.fail("Condição inicial do teste não foi cumprida! A collection não existe!");
            }
        });

        it(`A collection ${collectionName} deve ter em seu schema os campos ${requiredFieldNames} como obrigatórios`, async function(){
            if(collectionExists){
                let collectionInfo = collectionList.find((element) => element.name === collectionName && element.type === "collection");
                expect(collectionInfo).not.to.be.undefined;

                let collectionRequiredFieldNames;

                if(collectionInfo.options &&
                    collectionInfo.options.validator &&
                    collectionInfo.options.validator["$jsonSchema"] &&
                    collectionInfo.options.validator["$jsonSchema"].required){
                    collectionRequiredFieldNames = collectionInfo.options.validator["$jsonSchema"].required;
                }

                let collectionSchemaRequiredSet = new Set(collectionRequiredFieldNames);
                let validSchema = true;

                for(let fieldName of requiredFieldNames){
                    if(!collectionSchemaRequiredSet.has(fieldName)){
                        validSchema = false;
                        break;
                    }
                }

                if(!validSchema){
                    let message = `Um ou mais campos do schema da collection ${collectionName} não foram marcados como obrigatórios!
                    Esperado : ${requiredFieldNames.toString()} | Obtido : ${collectionRequiredFieldNames ? collectionRequiredFieldNames.toString() : "[]"}`;
                    assert.fail(message);
                }
            }else{
                assert.fail("Condição inicial do teste não foi cumprida! A collection não existe!");
            }
        });

        after(async function(){
            if(collectionExists){
                try{
                    let result = await db.dropCollection(collectionName);
                } catch(err){
                    console.log(err);
                }
            }
        });
    });

    describe("Índices de collection", function(){
       let collectionList;
       let indexCreated = false;
       let indexName = "";
       const fieldName = "requestDate";
       const ordering = "ASC";
       const fieldObjectToIndex = {
           [fieldName] : ordering === "ASC" ? 1 : -1
       };
       const indexOptions = {
           expireAfterSeconds: 600
       }

       before(async function(){
           if(!connectionOpened){
               assert.fail("Condição inicial do teste não foi cumprida! Erro ao conectar no banco de dados!");
           }

           try{
               collectionList = await db.checkAllCollections();
           }catch(err){
               assert.fail("Condição inicial do teste não foi cumprida! Erro ao listar todas as collections!");
           }

           expect(collectionList).to.be.an("array");

           let found = collectionList.find(element => element.name === collectionName && element.type === "collection");

           if(found){
               try{
                   await db.dropCollection(collectionName);
               }catch(err){
                   assert.fail(`Condição inicial do teste não foi cumprida! Erro ao excluir collection ${collectionName}`);
               }
           }

           try{
               await db.createCollection(collectionName, collectionSchema);
           }catch(err){
               assert.fail(`Condição inicial do teste não foi cumprida! Erro ao criar collection ${collectionName}`);
           }
       });

        it(`Deve listar com sucesso os índices da collection ${collectionName}`, async function(){
            let indexList;

            try{
                indexList = await db.indexesInformation(collectionName, {full : true});
            }catch(err){
                assert.fail(err.message);
            }

            expect(indexList).to.be.an("array");
        });

       it(`Deve criar um índice TTL no campo ${fieldName}`, async function(){
           let result;

           try{
               result = await db.createIndex(collectionName, fieldObjectToIndex, indexOptions);
           }catch(err){
                assert.fail(err.message);
           }

           let indexList;

           try{
               indexList = await db.indexesInformation(collectionName, {full : true});
           }catch(err){
               assert.fail(err.message);
           }

           expect(indexList).to.be.an("array");

           let index = indexList.find(element => {
               return element.key[fieldName];
           });

           expect(index).to.have.property("expireAfterSeconds");

           indexCreated = true;

           indexName = index.name;
       });

       it(`Não deve falhar em criar um índice já existente no campo ${fieldName} com as mesmas opções`, async function(){
            if(!indexCreated){
                assert.fail(`Condição inicial do teste não foi cumprida! O índice TTL não existe!`);
            }

           let result;

           try{
               result = await db.createIndex(collectionName, fieldObjectToIndex, indexOptions);
           }catch(err){
               assert.fail(err.message);
           }
       });

        it(`Deve falhar ao criar um índice já existente no campo ${fieldName} com opções diferentes`, async function(){
            if(!indexCreated){
                assert.fail(`Condição inicial do teste não foi cumprida! O índice TTL não existe!`);
            }

            let result;

            try{
                result = await db.createIndex(collectionName, fieldObjectToIndex);
                assert.fail(err.message);
            }catch(err){}
        });

        it(`Deve ter sucesso ao excluir o índice TTL criado no campo ${fieldName}`, async function(){
            if(!indexCreated){
                assert.fail(`Condição inicial do teste não foi cumprida! O índice TTL não existe!`);
            }

            let result;

            try{
                result = await db.dropIndex(collectionName, indexName);
            }catch(err){
                assert.fail(err.message);
            }
        });
    });

    describe(`Inserção de documento na collection ${collectionName}`, async function(){
        before(function(){
            if(!connectionOpened){
                assert.fail("Condição inicial do teste não foi cumprida! Erro ao conectar no banco de dados!");
            }
        });

        it(`Deve inserir com sucesso na collection ${collectionName} um documento que possua apenas os campos obrigatórios
         ${requiredFieldNames}`, async function(){
            let document = {
                requestHash : "F1E254",
                requestDate : new Date()
            }

            let result;

            try{
                result = await db.insertOne(collectionName, document);
            }catch(err){
                assert.fail(err.message);
            }
        });

        it(`Deve inserir com sucesso na collection ${collectionName} um documento que possua outros campos além dos obrigatórios
         ${requiredFieldNames}`, async function(){
            let document = {
                requestHash : "F1E254",
                requestDate : new Date(),
                requestIP : "192.168.213.31",
                requestMIME : "application/json"
            }

            let result;

            try{
                result = await db.insertOne(collectionName, document);
            }catch(err){
                assert.fail(err.message);
            }
        });

        it(`Deve falhar em inserir na collection ${collectionName} um documento que não possua todos os campos obrigatórios
        ${requiredFieldNames}`, async function(){
            let document = {
                requestHash : "F1E254"
            }

            let result;

            try{
                result = await db.insertOne(collectionName, document);
                assert.fail(err.message);
            }catch(err){}
        });
    });

    describe(`Listagem de documentos na collection ${collectionName}`, async function(){
        let documentsInserted = false;

        before(async function(){
            if(!connectionOpened){
                assert.fail("Condição inicial do teste não foi cumprida! Erro ao conectar no banco de dados!");
            }

            let collectionList;

            try{
                collectionList = await db.checkAllCollections();
            }catch(err){
                assert.fail("Condição inicial do teste não foi cumprida! Erro ao listar todas as collections!");
            }

            expect(collectionList).to.be.an("array");

            let found = collectionList.find(element => element.name === collectionName && element.type === "collection");

            if(found){
                try{
                    await db.dropCollection(collectionName);
                }catch(err){
                    assert.fail(`Condição inicial do teste não foi cumprida! Erro ao excluir collection ${collectionName}`);
                }
            }

            try{
                await db.createCollection(collectionName, collectionSchema);
            }catch(err){
                assert.fail(`Condição inicial do teste não foi cumprida! Erro ao criar collection ${collectionName}`);
            }
        });

        it(`Deve listar quatro documentos na collection ${collectionName}`, async function(){
           let documents = [
               {
                   requestHash : "F1A7BE",
                   requestDate : new Date(),
                   requestMIME : "application/xml"
               },
               {
                   requestHash : "67D9E3",
                   requestDate : new Date(),
                   requestMIME : "application/xml",
                   requestIP : "192.168.35.15"
               },
               {
                   requestHash : "71E6DF",
                   requestDate : new Date(),
                   requestIP : "192.168.35.10"
               },
               {
                   requestHash : "AB64C9",
                   requestDate : new Date(),
                   requestIP : "192.168.77.56"
               }
           ];

           let promises = [];
           for(let document of documents){
               promises.push(db.insertOne(collectionName, document));
           }

           let insertResult;
           try{
               insertResult = await Promise.all(promises);
           }catch(err){
               assert.fail("Erro ao inserir documentos para teste!");
           }

           let documentList;
           try{
               documentList = await db.query(collectionName);
           }catch(err){
               assert.fail(err.message);
           }

           expect(documentList).to.be.an("array");
           expect(documentList.length).to.equal(4);

           documentsInserted = true;
        });

        it("Filtro da listagem pela requestHash igual a F1A7BE deve trazer 1 resultado", async function(){
            if(!documentsInserted){
                assert.fail(`Condição inicial do teste não foi cumprida! Não há documentos na collection ${collectionName}!`);
            }

            let documentList;
            let filter = {
                requestHash : "F1A7BE"
            }

            try{
                documentList = await db.query(collectionName, filter);
            }catch(err){
                assert.fail(err.message);
            }

            expect(documentList).to.be.an("array");
            expect(documentList.length).to.equal(1);
        });

        it("Filtro da listagem pela requestMIME igual a application/xml deve trazer 2 resultados", async function(){
            if(!documentsInserted){
                assert.fail(`Condição inicial do teste não foi cumprida! Não há documentos na collection ${collectionName}!`);
            }

            let documentList;
            let filter = {
                requestMIME : "application/xml"
            }

            try{
                documentList = await db.query(collectionName, filter);
            }catch(err){
                assert.fail(err.message);
            }

            expect(documentList).to.be.an("array");
            expect(documentList.length).to.equal(2);
        });

        it("Filtro da listagem pela requestHash igual a 999999 deve trazer um vetor vazio", async function(){
            if(!documentsInserted){
                assert.fail(`Condição inicial do teste não foi cumprida! Não há documentos na collection ${collectionName}!`);
            }

            let documentList;
            let filter = {
                requestHash : "999999"
            }

            try{
                documentList = await db.query(collectionName, filter);
            }catch(err){
                assert.fail(err.message);
            }

            expect(documentList).to.be.an("array");
            expect(documentList.length).to.equal(0);
        });

        after(async function(){
            try{
                await db.dropCollection(collectionName);
            }catch(err){
                assert.fail(err.message);
            }
        });
    });

    describe("Encerramento de conexão com o banco de dados", function(){
        it("O encerramento da conexão, havendo ou não alguma aberta, deve ser realizado com sucesso.", async function(){
            try{
                let conn = await db.closeConnection();
            }catch(err){
                assert.fail("Erro ao fechar conexão com o banco de dados", "Sucesso no encerramento de conexão", err.message);
            }
        });
    });


});



