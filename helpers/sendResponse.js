const axios = require("axios");

function sendResponse(responseUrl, response) {
  console.log("attempting to respond");
  console.log("with response", response);
  console.log("at responseUrl", responseUrl);
  axios
    .post(responseUrl, response)
    .then(() => console.log(`Successfully responded to: ${responseUrl}`))
    .catch(e => console.error(`Error responding: ${responseUrl}`));
}

module.exports = sendResponse;
