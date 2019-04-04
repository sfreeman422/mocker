const Axios = require("axios");

function define(word) {
  const response = Axios.get(
    `http://api.urbandictionary.com/v0/define?term=${word}`
  )
    .then(res => {
      return res.data;
    })
    .catch(e => {
      console.log("error", e);
      return e;
    });
  return response;
}

module.exports = define;
