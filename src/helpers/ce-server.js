const express = require('express');
const bodyParser = require('body-parser');
const { HTTP } = require('cloudevents');

// http server with convinience middleware for cloudevents
module.exports = class CloudEventServer {
  constructor() {
    const server = express();
    server.use(bodyParser.urlencoded({ extended: false }));
    server.use(bodyParser.json());

    // middleware that automatically parses the http cloudevent and makes it available as req.cloudevent
    server.use(async (req, res, next) => {
      req.cloudevent = HTTP.toEvent({ headers: req.headers, body: req.body });
      console.log('📥 Received CloudEvent:', req.cloudevent.toJSON());

      next();
    });

    return server;
  }
};
