import Database from "./services/Database.js";
import express from 'express'
import bodyParser from 'body-parser'
import ProductApi from "./services/ProductApi.js";

const dbConnectionString = process.env.MONGODB_CONNSTRING;
const db = new Database(dbConnectionString);
const api = new ProductApi(db);
const app = express();
const serverPort = process.env.API_PORT || 3001;
let server = null;

process.on("SIGINT", async () => {
    server.close();
    await db.closeConnection();
});

process.on("SIGTERM", async () => {
    server.close();
    await db.closeConnection();
});

if(!dbConnectionString){
    console.log("A variável de ambiente MONGODB_CONNSTRING é obrigatória! Informe a variável e inicie o processo novamente.")
    process.kill(process.pid, "SIGTERM");
}

db.openConnection().then(async () => {
    try{
        await api.prepareDatabaseForApi();
    }catch(err){
        console.log(err.message);
        process.kill(process.pid, "SIGTERM");
    }

    app.use(bodyParser.raw({
        type: "*/*",
        limit: "2gb"
    }));

    app.disable("x-powered-by");

    app.use((_, res, next) => {
        res.setHeader("Access-Control-Allow-Origin" , "*");

        next();
    });

    app.post('/v1/products', api.updateProductsInformation);
    app.delete('/reset', api.resetApi);
    app.options("*", (_, res) => {
        let responseBody = {
            success : true,
            message : "Options ok!"
        }

        res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers" : "Content-Type, Content-Length, Accept",
            "Access-Control-Allow-Methods" : "POST, DELETE",
            "Content-Length": Buffer.from(JSON.stringify(responseBody)).length
        });

        res.end(JSON.stringify(responseBody));
    });
    app.all("*", (_,res) => {
        let responseBody = {
            success : false,
            message : "Método e/ou rota não encontrado!"
        }

        res.writeHead(404, {
            "Content-Type": "application/json",
            "Content-Length": Buffer.from(JSON.stringify(responseBody)).length
        });

        res.end(JSON.stringify(responseBody));
    });

    server = app.listen(serverPort, () => {
        console.log(`Servidor escutando na porta ${serverPort}`);
    });
}).catch(err => {
    console.log(err);
});


