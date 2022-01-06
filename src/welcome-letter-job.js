const { default: axios } = require('axios');
const fs = require('fs');
const CloudEventServer = require('./helpers/ce-server');

const ces = new CloudEventServer();

ces.post('/', async (req, res) => {
  try {
    const evt = req.cloudevent;
    console.log('Processing info for welcome letter...');
    await new Promise((resolve) => setTimeout(resolve, 10 * 1000));

    const customer = evt.data;
    const fileId = evt.id.split('-')[0];
    const filePath = `/out/${fileId}.txt`;
    const fileContent = `Herzlich Willkommen, ${customer.firstName} ${customer.lastName}!`;

    fs.writeFileSync(filePath, fileContent);

    // vanilla http request to demonstrate that the cloudevents library is optional
    await axios({
      method: 'post',
      url: process.env.CE_INGESTOR_URL,
      headers: {
        'ce-source': 'https://welcomeletter.rest-events.manuelottlik.de',
        'ce-type': 'evt.htp.re.file.created',
        'ce-subject': fileId,
      },
      data: {
        id: fileId,
        path: filePath,
        content: fileContent,
      },
    });

    console.log('Successfully created welcome letter.');
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

ces.listen(8081);
