const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const mocker = require('./helpers/mock.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/mock', (req, res) => {
  console.log(req.body);
  const mocked = mocker(req.body.text);
  const ephem_response = {
    response_type: "ephemeral",
    text: "\`Processing mock and sending to channel...\`"
  }
  const response = {
    response_type: "in_channel",
    text: `<@${req.body.user_id}>`,
    attachments: [
      {
        text: mocked
      }
    ]
  };

  axios.post(req.body.response_url, response)
    .then(() => console.log(`Successfully responded to: ${req.body.response_url}`))
    .catch((e) => console.error(`Error responding: ${req.body.response_url}`));
  res.setHeader('Content-type', 'application/json');
  res.send(ephem_response);
});

app.listen(PORT, (e) => {
  if (e) {
    console.error(e);
  } else {
    console.log("Successfully listening on port 3000");
  }
});