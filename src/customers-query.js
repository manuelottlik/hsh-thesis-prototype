const { default: axios } = require('axios');
const CloudEventServer = require('./helpers/ce-server');
const MockServer = require('./helpers/mock-server');
const EntityService = require('./helpers/entity-service');

const server = new MockServer({
  defaultData: {
    customers: [],
    assets: [],
    accounts: [],
  },
  queryService: true,
});

// provides endpoints for all events it is subscribed to and processes these with an EntityService

const assetService = new EntityService('assets');
const accountService = new EntityService('accounts');
const customerService = new EntityService('customers');

const ces = new CloudEventServer();

ces.post('/relations/assets/created', async (req, res) => {
  const evt = req.cloudevent;
  const { data: entity } = await axios.get(`http://${evt.source}/${evt.subject}`);

  await assetService.create(entity);

  server.restart();
  res.sendStatus(200);
});

ces.post('/relations/assets/updated', async (req, res) => {
  const evt = req.cloudevent;

  const { data: entity } = await axios.get(`http://${evt.source}/${evt.subject}`);

  if (!assetService.getById(evt.subject)) {
    assetService.create(entity);
  } else {
    assetService.update(evt.subject, entity);
  }

  server.restart();
  res.sendStatus(200);
});

ces.post('/relations/assets/deleted', async (req, res) => {
  const evt = req.cloudevent;

  if (assetService.getById(evt.subject)) {
    assetService.delete(evt.subject);

    server.restart();
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// process account events
ces.post('/relations/accounts/created', async (req, res) => {
  const evt = req.cloudevent;

  await accountService.create(evt.data);

  server.restart();
  res.sendStatus(200);
});

ces.post('/relations/accounts/updated', async (req, res) => {
  const evt = req.cloudevent;

  if (!accountService.getById(evt.subject)) {
    accountService.create(evt.data);
  } else {
    accountService.update(evt.subject, evt.data);
  }

  server.restart();
  res.sendStatus(200);
});

ces.post('/relations/accounts/deleted', async (req, res) => {
  const evt = req.cloudevent;

  if (accountService.getById(evt.subject)) {
    accountService.delete(evt.subject);

    server.restart();
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// process customer events
ces.post('/relations/customers/created', async (req, res) => {
  const evt = req.cloudevent;

  await customerService.create(evt.data);

  server.restart();
  res.sendStatus(200);
});

ces.post('/relations/customers/updated', async (req, res) => {
  const evt = req.cloudevent;

  if (!customerService.getById(evt.subject)) {
    customerService.create(evt.data);
  } else {
    customerService.update(evt.subject, evt.data);
  }

  server.restart();
  res.sendStatus(200);
});

ces.post('/relations/customers/deleted', async (req, res) => {
  const evt = req.cloudevent;

  if (customerService.getById(evt.subject)) {
    customerService.delete(evt.subject);

    server.restart();
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

ces.listen(8081);
