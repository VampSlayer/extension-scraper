const express = require('express');
const azureFunctionHandler = require('azure-aws-serverless-express');
 
const app = express();
 
app.get('/api/hello-world/', (req, res) => res.send('Hello World!'));
 
module.exports = azureFunctionHandler(app);