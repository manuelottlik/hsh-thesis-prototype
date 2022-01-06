const { CloudEvent, HTTP } = require('cloudevents');
const axios = require('axios');

// process.env.CE_INGESTOR_URL = process.env.CE_INGESTOR_URL || 'http://localhost:8085';

// express interceptor that sends events based on the request data
module.exports = async (req, res, body) => {
  const parts = req.url.split('?')[0].split('/').filter((part) => part.length > 0);
  const id = req.method === 'POST' ? `${body.id}` || null : parts.pop();
  const operation = {
    post: 'created',
    put: 'updated',
    patch: 'updated',
    delete: 'deleted',
  }[req.method.toLowerCase()];

  const type = [
    'evt.htp.re',
    parts.join('/'),
    operation,
  ].join('.').toLowerCase();

  const evt = new CloudEvent({
    source: `${req.headers.host}/${parts.join('/')}`,
    type,
    subject: id,
    data: process.env.EVENT_NOTIFICATIONS === 'true' ? {} : JSON.parse(body),
  });

  const { body: data, headers } = HTTP.binary(evt);

  try {
    await axios({
      method: 'post',
      url: process.env.CE_INGESTOR_URL,
      data,
      headers,
    });

    console.log('📣 Published CloudEvent:', evt.toJSON());
  } catch (error) {
    console.error(`❌ Publishing CloudEvent ${evt.id} failed: ${error}`);
  }
};
