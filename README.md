# Desafio Linx/Florianópolis
Repositório do projeto referente ao processo seletivo da Linx Florianópolis para a vaga de Fullstack Developer. 

O desafio se refere a dois exercícios, **sendo o primeiro obrigatório** e o segundo opcional. O exercício obrigatório se refere a uma API REST, que irá  receber requisições em formato JSON para atualização de informações de produtos. O exercício opcional se refere a um agregador de URL de imagens de produtos.

#### Exercício Obrigatório - Atualização de Produtos
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

Não é necessário instalar uma instância do MongoDB. É possível utilizar gratuitamente o [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) para utilizar uma instância na nuvem. Basta se cadastrar, fazer as configurações básicas de usuário, **liberar o seu IP atual na seção Network Access para que você consiga se conectar à instância**, e usar a string de conexão para utilização no projeto. 

Para o restante dos pré-requisitos, as sub-seções abaixo explicam o processo de instalação.
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
O repositório possui a estrutura apresentada abaixo: 
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


A pasta "part-1" se refere à implementação do exercício obrigatório, e a pasta "part-2", se houver, se refere à implementação do exercício opcional. 

As pastas "part-1" e "part-2" são projetos Node.js separados.
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

Ao preencher alguma das variáveis no arquivo acima com um valor válido (string diferente de vazio e número diferente de 0), o projeto irá setar essas variáveis na inicialização para que possam ser utilizadas. 

**Caso alguma variável de ambiente tenha sido setada, essa ação NÃO irá sobrescrever seu valor**, portanto, a variável de ambiente tem precedência sobre o arquivo JSON.  
### API REST - Instalação e inicialização 
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
### API REST - Informações Gerais
**A porta padrão da API é 3001**. Caso seja necessário alterá-la, verifique a seção Variáveis de Ambiente acima.

A API possui os seguintes endpoints:
- */v1/products* - Método POST - Método principal da API
- */reset* - Método DELETE - **Apaga e recria a estrutura inicial do banco de dados. Ela apenas executa com sucesso se a variável de ambiente NODEJS_APP_ENVIRONMENT não estiver marcada como production**.
- Método OPTIONS - Qualquer endpoint - Retorna os métodos HTTP utilizáveis.

Ao enviar uma requisição para o método POST, a API irá gerar uma Hash alfanumérica de 172 dígitos baseado nas seguintes informações da requisição:
- Host (IP e Porta);
- Tipo MIME do Content-Type;
- Comprimento em bytes do corpo da requisição;
- Corpo da requisição;
- Endpoint enviado;
- Método HTTP utilizado;

As informações são convertidas para um Array de bytes, e logo em seguida convertidas para dígitos hexadecimais. Uma lógica interna é utilizada para manter sempre o mesmo comprimento de bytes para cada informação.

São utilizados 11 bytes do corpo da requisição(4 no ínicio, 3 no meio e 4 no fim) para gerar os últimos 22 dígitos da Hash. 

Dessa maneira, é possível identificar se a requisição é repetida sem precisar fazer o parse do corpo da requisição para analisar chave a chave. 

Após a Hash ser gerada, a API consulta no banco de dados se existe uma Hash igual a ela. Caso não exista, um documento é inserido no MongoDb com a Hash, e a requisição executa o resto da lógica retornando status 200. Caso a Hash já exista, a requisição retorna status 403.

**O bloqueio de 10 minutos é realizado por meio de índices TTL (Time to Live) no MongoDB**. Ao criar uma *collection* com índice TTL e definir sua duração, o MongoDB executa uma tarefa a cada 60 segundos para identificar se algum documento expirou. Caso positivo, ele é deletado automaticamente.

**Devido ao MongoDB executar a tarefa a cada 60 segundos, pode ser que o documento demore mais que 10 minutos e menos que 11 minutos para ser apagado**.

A API REST pode retornar os seguintes códigos de status:
- 200 - Ok;
- 403 - Proibido;
- 404 - Não encontrado;
- 500 - Erro interno do servidor.     

### Testes Automatizados

Os comandos abaixo são utilizados para testes automatizados, por meio das bibliotecas Mocha e Chai, são eles:
```bash
# Teste unitário da classe responsável pelo acesso ao banco de dados. 
# Pode ser executado isoladamente
npm run test-database

# Teste unitário dos principais métodos utilizados pela API REST. 
# Pode ser executado isoladamente
npm run test-productapi

# Teste da própria API REST. 
# NÃO PODE SER EXECUTADO ISOLADAMENTE. É necessário iniciar a API REST em um terminal e executar esse comando em outro terminal
npm run rest_api-test
``` 

**Visto que o teste da API REST envia uma requisição de 1GB de tamanho, é necessário aumentar o limite de memória padrão do Node.js**. 

Isso pode ser realizado setando a seguinte variável de ambiente:
```text
NODE_OPTIONS: --max_old_space_size=8192
```


  
