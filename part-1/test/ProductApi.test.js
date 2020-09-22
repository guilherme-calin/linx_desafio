import Database from "../src/services/Database.js";
import ProductApi from "../src/services/ProductApi.js";
import loadEnvironmentVariablesIfAny from "../src/load_env.js";
import mocha from 'mocha';
import chai  from 'chai'


const describe = mocha.describe;
const it = mocha.it;
const expect = chai.expect;
const assert = chai.assert;

loadEnvironmentVariablesIfAny();

const productApi = new ProductApi(new Database(process.env.MONGODB_CONNSTRING));

describe("Suite de testes para os métodos principais utilizados na API, referentes à classe ProductApi", function(){
    const mandatoryRequestKeys = ["headers.host", "headers[\"content-type\"]", "url", "method", "body"]

    describe("Validação da requisição", function(){
        it(`Deve ter sucesso caso o corpo da requisição seja do tipo Buffer e as seguintes propriedades existam no objeto da requisição:
        ${mandatoryRequestKeys}`, function (){
            const req = {
                headers : {
                    host : "localhost:3212",
                    "content-type" : "application/json",
                },
                url : "/v1/products",
                method : "POST",
                body : new Buffer.from("Frase de teste")
            }

            let validationObject = productApi.validRequestForAlphaHash(req);

            expect(validationObject).to.have.property("valid");
            expect(validationObject).to.have.property("errorMessage");
            expect(validationObject.valid).to.be.true;
            expect(validationObject.errorMessage).to.equal("");
        });

        it(`Deve falhar caso o corpo da requisição não exista e as seguintes propriedades existam no objeto da requisição:
        headers.host,headers[\"content-type\"],url,method`, function (){
            const req = {
                headers : {
                    host : "localhost:3212",
                    "content-type" : "application/json",
                },
                url : "/v1/products",
                method : "POST"
            }

            let validationObject = productApi.validRequestForAlphaHash(req);

            expect(validationObject).to.have.property("valid");
            expect(validationObject).to.have.property("errorMessage");
            expect(validationObject.valid).to.be.false;
            expect(validationObject.errorMessage).not.to.equal("");
        });

        it(`Deve falhar caso o corpo da requisição não seja do tipo Buffer e os seguintes campos existam no objeto da requisição:
        ${mandatoryRequestKeys}`, function (){
            const req = {
                headers : {
                    host : "localhost:3212",
                    "content-type" : "application/json",
                },
                url : "/v1/products",
                method : "POST",
                body : "Sou uma string :)"
            }

            let validationObject = productApi.validRequestForAlphaHash(req);

            expect(validationObject).to.have.property("valid");
            expect(validationObject).to.have.property("errorMessage");
            expect(validationObject.valid).to.be.false;
            expect(validationObject.errorMessage).not.to.equal("");
        });
    });

    describe("Geração de Hash alfanumérica da requisição", function(){
        it("Uma requisição com exatamente as mesmas informações deve gerar a mesma Hash", function(){
            const req = {
                headers : {
                    host : "localhost:3212",
                    "content-type" : "application/json",
                },
                url : "/v1/products",
                method : "POST",
                body : new Buffer.from("Frase de teste um tanto quanto longa de certa forma")
            }

            let hash = productApi.generateAlphaHash(req);

            for(let i=2500; i > 0; i--){
                let newHash = productApi.generateAlphaHash(req);

                if(newHash !== hash){
                    assert.fail("Hashs geradas são diferentes para as mesmas informações!");
                    break;
                }
            }
        });

        it("Requisições com alguma informação diferente, por menor que seja, devem gerar Hashs diferentes", function(){
            let hashArray = [];
            let message = "Frase de teste um tanto quanto longa de certa forma";
            const req = {
                headers : {
                    host : "localhost:3112",
                    "content-type" : "application/json",
                },
                url : "/v1/products",
                method : "POST",
                body : new Buffer.from(message)
            };

            //Por 20000 iterações, adicione um caractere 'a' no corpo da requisição e gere uma nova hash
            for(let i=0; i < 20000; i++){
                let hashReq = productApi.generateAlphaHash(req);
                hashArray.push(hashReq);

                message += "a";
                req.body = new Buffer.from(message);
            }

            //Visto que um conjunto ignora valores repetidos,
            //usar seu tamanho é uma ótima ferramenta para
            //identificar se o critério de unicidade da hash foi violado
            let hashSet = new Set(hashArray);

            expect(hashSet.size).to.equal(hashArray.length);
        });

        it("Todas as Hashs geradas devem possuir 172 dígitos", function(){
            const hashSize = 172;
            let message = "Frase";
            const req = {
                headers : {
                    host : "localhost:3112",
                    "content-type" : "application/json",
                },
                url : "/v1/products",
                method : "POST",
                body : new Buffer.from(message)
            };

            //Por 20000 iterações, adicione um caractere 'a' no corpo da requisição e gere uma nova hash.
            //Verifique em seguida se a quantidade de dígitos é respeitada
            for(let i=0; i < 20000; i++){
                let hashReq = productApi.generateAlphaHash(req);

                if(hashReq.length !== hashSize){
                    expect(hashReq.length).to.equal(hashSize);
                    break;
                }

                message += "a";
                req.body = new Buffer.from(message);
            }
        });
    });
});