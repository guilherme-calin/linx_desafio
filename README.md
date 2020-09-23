# Desafio Linx/Florianópolis
Repositório do projeto referente ao processo seletivo da Linx Florianópolis para a vaga de Fullstack Developer. O desafio se refere a dois exercícios, **sendo o primeiro obrigatório** e o segundo opcional. O exercício obrigatório se refere a uma API REST, que irá  receber requisições em formato JSON para atualização de informações de produtos. O exercício opcional se refere a um agregador de URL de imagens de produtos.

#### API REST - Atualização de Produtos (Obrigatório)
Deve ser desenvolvida uma API REST que bloqueie requisições repetidas em um intervalo de 10 minutos, conforme exemplo abaixo:

```bash
# 2018-03-01T13:00:00 - primeira requisição, durante 10 minutos requests com o mesmo corpo serão negadas
curl -XPOST http://your-api.chaordic.com.br/v1/products -d '[{"id": "123", "name": "mesa"}]' #=> 200 OK

# 2018-03-01T13:09:59 - mesmo corpo que a request anterior.
curl -XPOST http://your-api.chaordic.com.br/v1/products -d '[{"id": "123", "name": "mesa"}]' #=> 403 Forbidden

# 2018-03-01T13:10:00 - agora a API deve voltar a aceitar o corpo
curl -XPOST http://your-api.chaordic.com.br/v1/products -d '[{"id": "123", "name": "mesa"}]' #=> 200 OK
```

Outros requisitos incluem:
- O bloqueio de requisições repetidas deve se manter mesmo em um ambiente distribuído, independente do nó que receber a requisição;
- Deve funcionar em ambiente Linux;
- Deve possuir testes automatizados.

## Pré-requisitos do Projeto
O desafio foi implementado utilizando linguagem Javascript + Node.js. Sendo assim, os seguintes componentes são necessários:
- Node.js - Versão mínima 12.18.4;
- NPM (Node Package Manager) - Versão mínima 6.14.6.
- Banco de dados MongoDB.

É possível utilizar gratuitamente o [MongoDB Atlas]
####  Windows
No sistema operacional Windows, o setup disponível no site oficial do [Node.js](https://nodejs.org/en/) já possui tanto o Node,js quanto o NPM.

#### Linux
Para sistemas operacionais Linux, a instalação do NPM é separada da instalação do Node.js. Para as distros Ubuntu e Debian, eles podem ser instalados com os comandos:
```bash
sudo apt update
sudo apt install nodejs
sudo apt install npm
```

Para conferir se a instalação foi realizada corretamente, acesse o terminal e digite os comandos:
```bash
node -v
npm -v
```

Se a instalação de ambos foi realizada corretamente, os comandos irão retornar as respectivas versões.

## Estrutura do Repositório
O repositório possui a estrutura apresentada abaixo. A pasta "part-1" se refere à implementação do exercício obrigatório, e a pasta "part-2", se houver, se refere à implementação do exercício opcional. As pastas "part-1" e "part-2" são projetos Node.js separados.
```
README.md
part-1/
 |--env_exemplo.yaml
 |--set_env.json
 |--package.json
 |--package-lock.json
 |--src/
 |    |--load_env.js
 |    |--main.js
 |    |--models/
 |    |     |--HttpError.js
 |    |--services/
 |        |--Database.js
 |        |--ProductApi.js
 |--test/
      |--Database.test.js     
      |--ProductApi.test.js
      |--rest_api.test.js
```
## Informações - Exercício Obrigatório (part-1)
### Variáveis de Ambiente
**As seguintes variáveis de ambiente são utilizadas nesse projeto**, conforme arquivo YAML env_exemplo.yaml:

```yaml
 # PORTUGUÊS(BRASILEIRO)
 # Esse arquivo contém as informações de quais variáveis de ambiente são consideradas
 # para o funcionamento do projeto, e exemplos de valores para cada uma.
 # As variáveis de ambiente obrigatórias possuem a chave "mandatory" setada para true, e as
 # não-obrigatórias possuem a chave "mandatory" setada para false.
 # Caso haja um valor padrão para alguma variável, ela será informada na chave "default".
 # Exemplos de valores são informados na chave "example".

 # ENGLISH
 # This file contains information about the necessary and optional environment variables for this project,
 # along with value examples for each one.
 # The mandatory variables contain the "mandatory" key set to true, while the optional ones contain the "mandatory" key set to false.
 # Default values for a variable, if there´s any, are included in the "default" key.
 # Value examples are shown in the "example" key.

 MONGODB_CONNSTRING:
   mandatory: true
   example: mongodb+srv://admin-user:strongpassword@my-cluster.0zwl0.gcp.mongodb.net/linx_part1?retryWrites=true&w=majority
   description_ptbr: String de conexão para banco de dados MongoDB.
   description_en: MongoDB database connection string.
 NODEJS_API_HOST:
   mandatory: false
   default: localhost
   example: 192.168.100.201
   description_ptbr: Host de conexão para a API REST do projeto.
   description_en: Project´s REST API host to connect to.
 NODEJS_API_PORT:
   mandatory: false
   default: 3001
   example: 3000
   description_ptbr: Porta de conexão para a API REST do projeto.
   description_en: Project´s REST API port to connect/listen to.
 NODEJS_APP_ENVIRONMENT:
   mandatory: false
   default: development
   example: production
   description_prbr: Indica o ambiente de execução da aplicação. Para ambiente de produção, ele deve ser explícitamente informado como production
   description_en: Differentiates between production and development environments. For production environment, it´s value must be explicitly set to "production"
```

Caso não seja possível setar uma ou mais variáveis de ambiente (ou não queira), **é possível utilizar o arquivo set_env.json para conseguir o mesmo efeito**. O arquivo possui a seguinte estrutura padrão:
```json
{
  "NODEJS_APP_ENVIRONMENT" : "",
  "NODEJS_API_PORT" : 0,
  "NODEJS_API_HOST" : "",
  "MONGODB_CONNSTRING" : ""
}
```

Ao preencher alguma das variáveis no arquivo acima com um valor válido (string diferente de vazio e número diferente de 0), o projeto irá setar essas variáveis na inicialização para que possam ser utilizadas. **Caso alguma variável de ambiente tenha sido setada, essa ação NÃO irá sobrescrever seu valor**, portanto, a variável de ambiente tem precedência sobre o arquivo JSON.  
### Utilização 
Após clonar o repositório, abra um terminal e acesse a pasta "part-1". Execute o seguinte comando para instalar as dependências do projeto:

```bash
npm install
``` 

Após a instalação, o projeto está pronto para ser executado. Os seguintes comandos podem ser utilizados para iniciar a API REST:
```bash
# Inicia a API REST (produção)
npm start
#Inicia a API REST (Desenvolvimento) - Reinicia automaticamente a cada vez que o código é alterado.
npm run dev
``` 

**A porta padrão da API é 3001**.


  
