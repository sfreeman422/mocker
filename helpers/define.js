const Axios = require("axios");

function define(word) {
  const response = Axios.get(
    `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${
      process.env.dictKey
    }`
  )
    .then(res => res.data)
    .catch(e => e);
  return response;
}

module.exports = define;
