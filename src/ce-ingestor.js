const express = require('express');
const { HTTP } = require('cloudevents');
const bodyParser = require('body-parser');
const CENATS = require('./helpers/cenats');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

CENATS.connect(process.env.NATS_URL);

// endpoint where cloudevents can be sent to
app.post('/', async (req, res) => {
  const evt = HTTP.toEvent({ headers: req.headers, body: req.body });
  console.log('📥 Received CloudEvent:', evt.toJSON());
  try {
    await CENATS.publish(evt);

    console.log(`📣 Successfully published ${evt.id} to NATS.`);
    res.status(200).send(`Successfully published ${evt.id} to NATS.`);
  } catch (error) {
    if (error.code === '503') {
      const errMsg = `There is no stream for event type "${evt.type}". Please create a stream before publishing events with this type.`;

      console.error('❌', errMsg);
      res.status(400).send(errMsg);
    } else {
      console.error('❌', error);
      res.status(500).send(error);
    }
  }
});

app.listen(80);
