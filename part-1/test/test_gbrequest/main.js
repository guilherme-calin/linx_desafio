import axios from "axios";

console.log("Início do teste");
console.log(new Date().toISOString());

getDataObject().then(testData => {
    console.log("Vai enviar a requisição!");
    axios.post("http://localhost:3000/v1/products",
        Buffer.from(JSON.stringify(testData)),
        {
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        }).then((res) =>{
        console.log("Requisição finalizada!");
        console.log(new Date().toISOString());
    }).catch(err => {
        console.log("Erro!");
        console.log(err.message);
    });
}).catch(err => {
    console.log(err);
})

function getDataObject(){
    return new Promise((resolve, reject) => {
        const size = 1720000;
        const numberOfPromises = 16;
        let promises = [];
        let data = {};

        for(let i=0; i < numberOfPromises; i++){
            promises.push(generateData(i * size / numberOfPromises, (i + 1) * size / numberOfPromises, data));
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
        console.log(`Promise de valor ${start} a ${end} iniciada!`);

        for(let i=start; i < end; i++){
            try{
                data[`field${i}`] = "aaaaaaaaabbbbbbbbccccccccccddddddzewqafdefdddddddddddeeeezzzzzeeeefffffffffffffffffffaaaaaaaaabbbbbbbbccccccccccddddddzewqafdefdddddddddddeeeezzzzzeeeefffffffffffffffffffaaaaaaaaabbbbbbbbccccccccccddddddzewqafdefdddddddddddeeeezzzzzeeeefffffffffffffffffffaaaaaaaaabbbbbbbbccccccccccddddddzewqafdefdddddddddddeeeezzzzzeeeefffffffffffffffffff\naaaaaaaaabbbbbbbbccccccccccddddddzewqafdefdddddddddddeeeezzzzzeeeefffffffffffffffffffaaaaaaaaabbbbbbbbccccccccccddddddzewqafdefdddddddddddeeeezzzzzeeeefffffffffffffffffffaaaaaaaaabbbbbbbbccccccccccddddddzewqafdefdddddddddddeeeezzzzzeeeefffffffffffffffffffblablabla";
            }catch(err){
                reject(err);
            }
        }

        console.log(`Promise de valor ${start} a ${end} a ser finalizada!`);
        resolve(true);
    });
}