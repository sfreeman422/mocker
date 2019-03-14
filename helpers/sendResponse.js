const axios = require("axios");

function sendResponse(responseUrl, response) {
  axios
    .post(responseUrl, response)
    .then(() => console.log(`Successfully responded to: ${responseUrl}`))
    .catch(e => console.error(`Error responding: ${responseUrl}`));
}

module.exports = sendResponse;
