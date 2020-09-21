import Database from "./services/Database.js";

let string = "mongodb+srv://admin-user:hellfire@igtifullstack-cluster.0zwl0.gcp.mongodb.net/linx_part1?retryWrites=true&w=majority";
let db = new Database(string);


process.on("SIGINT", async () => {
    console.log("on SIGINT!");
    await db.closeConnection();
});

process.on("SIGTERM", async () => {
    console.log("on SIGTERM!");
    await db.closeConnection();
});

db.openConnection().then(async () => {
    try{
        let result = await db.dropCollection("request");
        console.log(result);
    }catch(err){
        console.log(err);
        setTimeout(() => true, 3000);
        process.kill(process.pid, "SIGTERM");
    }
}).catch(err => {
    console.log(err);
});


