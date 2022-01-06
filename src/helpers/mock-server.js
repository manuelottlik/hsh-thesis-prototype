const jsonServer = require('json-server');
const nocache = require('nocache');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

// decorates the usual json server with some restart options for updating the database its using
module.exports = class MockServer {
  constructor({
    port = 8080,
    defaultData = {},
    dbPath = '/etc/data/db/db.json',
    queryService = false,
  }) {
    this.port = port;
    this.dbPath = dbPath;
    this.queryService = queryService;

    this.initDb(defaultData);
    this.start();

    console.log(`🏃 JSON Server is running on port ${this.port}.`);
  }

  initDb(defaultData) {
    const adapter = new FileSync(this.dbPath);
    const db = low(adapter);

    db.defaults(defaultData).write();
  }

  start() {
    this.server = jsonServer.create();
    this.server.use(jsonServer.defaults());
    this.server.use(jsonServer.bodyParser);
    this.server.use(nocache());

    // only allow get requests
    this.server.use((req, res, next) => {
      if (this.queryService === true && req.method !== 'GET') {
        res.sendStatus(405);
      }

      next();
    });

    this.server.use(jsonServer.router(this.dbPath));

    this.instance = this.server.listen(this.port);
  }

  stop() {
    this.instance.close();
  }

  restart() {
    this.stop();
    this.start();
  }
};
