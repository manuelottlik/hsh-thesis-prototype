const express = require('express');
const bodyParser = require('body-parser');
const proxyMiddlware = require('./helpers/proxy-middlware');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// express middleware that proxies the request depending on the http method used
app.use((req, res, next) => {
  if (req.method === 'GET') {
    return proxyMiddlware(process.env.QUERY_SERVICE_URL)(req, res, next);
  }

  // enabled cqrsMode in proxyMiddleware
  return proxyMiddlware(process.env.COMMAND_SERVICE_URL, true)(req, res, next);
});

app.listen(8080);
console.log(`🏃🏽‍♂️ CQRS Middleware is running and forwarding requests to ${process.env.QUERY_SERVICE_URL} and ${process.env.COMMAND_SERVICE_URL}.`);
