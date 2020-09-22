import axios from "axios";
import mocha from 'mocha';
import chai  from 'chai'

const describe = mocha.describe;
const it = mocha.it;
const expect = chai.expect;
const assert = chai.assert;

describe("Teste de requisições para a API desenvolvida", function(){
    const apiHost = process.env.API_HOST || "localhost";
    const apiPort = process.env.API_PORT || "3001";
    const apiBaseUrl = `http://${apiHost}:${apiPort}`;

    let initialRequestSuccessed = false;
    let requestOptions = {
        maxContentLength: Infinity,
        maxBodyLength: Infinity
    };
    let requestDataForTest = {
        text: "Texto para teste!"
    };

    it("Requisição inicial para o método Options deve retornar status 200", async function(){
        try{
            let res = await axios.options(apiBaseUrl+"/v1/products",
                requestDataForTest,
                requestOptions);

            expect(res.status).to.equal(200);
            initialRequestSuccessed = true;
        }catch(err){
            assert.fail(err.message);
        }
    });

    it("Requisição para resetar a API deve retornar status 200", async function(){
        if(!initialRequestSuccessed){
            assert.fail("Condição inicial do teste não foi cumprida! Houve um erro na requisição inicial!");
        }

        try{
            let res = await axios.delete(apiBaseUrl+"/reset",
                requestDataForTest,
                requestOptions);

            expect(res.status).to.equal(200);
        }catch(err){
            assert.fail(err.message);
        }
    });

    it("O envio da primeira requisição POST deve retornar status 200", async function(){
        if(!initialRequestSuccessed){
            assert.fail("Condição inicial do teste não foi cumprida! Houve um erro na requisição inicial!");
        }

        try{
            let res = await axios.post(apiBaseUrl+"/v1/products",
                requestDataForTest,
                requestOptions);

            expect(res.status).to.equal(200);
        }catch(err){
            assert.fail(err.message);
        }
    });

    it("As próximas 100 requisições com o mesmo corpo do item anterior devem retornar status 403", async function(){
        if(!initialRequestSuccessed){
            assert.fail("Condição inicial do teste não foi cumprida! Houve um erro na requisição inicial!");
        }

        for(let i=0; i < 100; i++){
            try{
                let res = await axios.post(apiBaseUrl+"/v1/products",
                    requestDataForTest,
                    requestOptions);
                assert.fail("A requisição deveria ter retornado status 403!");
            }catch(err){
                expect(err.response.status).to.equal(403);
            }
        }
    });

    it("O envio de uma nova requisição POST com um corpo diferente deve retornar status 200", async function(){
        if(!initialRequestSuccessed){
            assert.fail("Condição inicial do teste não foi cumprida! Houve um erro na requisição inicial!");
        }

        requestDataForTest.text += "a";

        try{
            let res = await axios.post(apiBaseUrl+"/v1/products",
                requestDataForTest,
                requestOptions);

            expect(res.status).to.equal(200);
        }catch(err){
            assert.fail(err.message);
        }
    });

    it("O envio de uma requisição POST com um corpo de tamanho aproximado de 1GB deve retornar status 200", async function(){
        if(!initialRequestSuccessed){
            assert.fail("Condição inicial do teste não foi cumprida! Houve um erro na requisição inicial!");
        }

        let bigObject;

        try{
            bigObject = await getBigDataObject();
        }catch(err){
            assert.fail(err.message);
        }

        try{
            let res = await axios.post(apiBaseUrl+"/v1/products",
                bigObject,
                requestOptions);

            expect(res.status).to.equal(200);
        }catch(err){
            assert.fail(err.message);
        }
    });
});

function getBigDataObject(){
    return new Promise((resolve, reject) => {
        const size = 1720000;
        const numberOfPromises = 16;
        let promises = [];
        let data = {};

        for(let i=0; i < numberOfPromises; i++){
            promises.push(generateData(parseInt(i * size / numberOfPromises), parseInt((i + 1) * size / numberOfPromises), data));
        }

        Promise.all(promises).then(result => {
            resolve(data);
        }).catch(err => {
            reject(err);
        });
    });
}

function generateData(start, end, data){
    return new Promise((resolve, reject) => {
        for(let i=start; i < end; i++){
            try{
                data[`field${i}`] = "aaaaaaaaabbbbbbbbccccccccccddddddzewqafdefdddddddddddeeeezzzzzeeeefffffffffffffffffffaaaaaaaaabbbbbbbbccccccccccddddddzewqafdefdddddddddddeeeezzzzzeeeefffffffffffffffffffaaaaaaaaabbbbbbbbccccccccccddddddzewqafdefdddddddddddeeeezzzzzeeeefffffffffffffffffffaaaaaaaaabbbbbbbbccccccccccddddddzewqafdefdddddddddddeeeezzzzzeeeefffffffffffffffffff\naaaaaaaaabbbbbbbbccccccccccddddddzewqafdefdddddddddddeeeezzzzzeeeefffffffffffffffffffaaaaaaaaabbbbbbbbccccccccccddddddzewqafdefdddddddddddeeeezzzzzeeeefffffffffffffffffffaaaaaaaaabbbbbbbbccccccccccddddddzewqafdefdddddddddddeeeezzzzzeeeefffffffffffffffffffblablabla";
            }catch(err){
                reject(err);
            }
        }

        resolve(true);
    });
}

