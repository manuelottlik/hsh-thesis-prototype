const axios = require('axios');
const { HTTP } = require('cloudevents');
const fs = require('fs');
const yaml = require('js-yaml');
const CENATS = require('./helpers/cenats');

// sends an http cloudevent to a configured adress
function handleEvent(evt, targetPath) {
  const { body: data, headers } = HTTP.binary(evt);

  return axios({
    method: 'post',
    url: process.env.TARGET_URL + targetPath,
    data,
    headers,
  });
}

// handles nats subscriptions
// has a few default settings
async function handleSubscription(sub) {
  const cfg = {
    durable_name: sub.consumer,
    filter_subject: sub.subject,
    ack_wait: 30 * 1000 ** 3,
    max_deliver: 1000,
    max_ack_pending: 1,
  };

  return CENATS.subscribe(cfg, (evt) => handleEvent(evt, sub.path));
}

// loads injected configmap on startup and opens all subscriptions to nats
(async () => {
  try {
    const SUBSCRIPTIONS = yaml.load(fs.readFileSync('/etc/config/subscriptions.yml', 'utf8'));

    await CENATS.connect(process.env.NATS_URL);
    await Promise.all(SUBSCRIPTIONS.map(handleSubscription));
  } catch (error) {
    console.error('❌', error);
    await CENATS.close();
    process.exitCode = 1;
  }
})();
