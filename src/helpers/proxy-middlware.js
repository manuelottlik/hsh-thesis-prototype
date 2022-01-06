const axios = require('axios').default;

// forwards request to destination url with axios
async function forwardRequest(url, incRequest) {
  const axiosConfig = {
    url,
    method: incRequest.method,
    headers: incRequest.headers,
    params: incRequest.params,
    data: incRequest.body,
  };

  // console.log('AxiosConfig', axiosConfig);

  return axios(axiosConfig);
}

// returns response to original caller
async function returnResponse(incResponse, outResponse, cqrsMode) {
  // when in cqrs mode, no data is returned, since the processing is handled async.
  return outResponse.status(cqrsMode ? 202 : incResponse.status).header(incResponse.headers).send(cqrsMode ? undefined : incResponse.data);
}

// express middleware intercepting the request and forwarding it to the desired url
module.exports = (url, cqrsMode = false) => async (incRequest, outResponse, next) => {
  try {
    const destinationUrl = url + incRequest.url;

    console.log(`Proxying request to ${destinationUrl}.`);
    const incResponse = await forwardRequest(destinationUrl, incRequest);
    console.log('Received response, forwarding to client.');

    returnResponse(incResponse, outResponse, cqrsMode);
  } catch (error) {
    console.error(`❌ Forwarding request failed: ${error}`);
    outResponse.status(500).send(error);
  }

  next();
};
