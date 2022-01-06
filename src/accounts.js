const MockServer = require('./helpers/mock-server');

new MockServer({
  defaultData: {
    accountType: [],
    accounts: [],
    customers: [],
  },
});
