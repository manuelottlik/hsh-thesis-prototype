const express = require('express');
const interceptor = require('express-interceptor');
const bodyParser = require('body-parser');
const proxyMiddlware = require('./helpers/proxy-middlware');
const publishRequest = require('./helpers/publish-request');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// process.env.DESTINATION_URL = process.env.DESTINATION_URL || 'http://localhost:8080';

// express middleware that intercepts outgoing responses based on isInterceptable and publishes events
app.use(interceptor((req, res) => ({
  isInterceptable: () => res.statusCode >= 200 && res.statusCode < 300 && req.method !== 'GET',
  intercept: (body, send) => send(body),
  afterSend: (body) => publishRequest(req, res, body),
})));

app.use(proxyMiddlware(process.env.DESTINATION_URL));

app.listen(8088);
console.log(`🏃🏽‍♂️ REST-Events Middleware is running and forwarding requests to ${process.env.DESTINATION_URL}.`);
