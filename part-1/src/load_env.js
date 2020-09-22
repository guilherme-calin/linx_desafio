import fs from 'fs'

const environmentFilePath = "./set_env.json"

export default function loadEnvironmentVariablesIfAny(filePath){
    let path = filePath || environmentFilePath;
    let userSetEnvironment;

    try{
        userSetEnvironment = JSON.parse(fs.readFileSync(environmentFilePath, "utf-8"));
    }catch(err){
        //console.log(err.message);
    }

    //Seta a variável de ambiente apenas se ela não existir no ambiente
    if(userSetEnvironment){
        for(let environmentVariableName in userSetEnvironment){
            if(userSetEnvironment.hasOwnProperty(environmentVariableName)){
                if(!process.env[environmentVariableName] && userSetEnvironment[environmentVariableName]){
                    process.env[environmentVariableName] = userSetEnvironment[environmentVariableName];
                }
            }
        }
    }

    return
}

loadEnvironmentVariablesIfAny();