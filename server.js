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
  const response = {
    response_type: "in_channel",
    attachments: [
      {
        text: mocked
      }
    ]
  };

  axios.post(req.body.response_url, response)
    .then(() => console.log(`Successfully responded to: ${req.body.response_url}`))
    .catch((e) => console.error(`Error responding: ${req.body.response_url}`));
  res.send(200);
});

app.listen(PORT, (e) => {
  if (e) {
    console.error(e);
  } else {
    console.log("Successfully listening on port 3000");
  }
});