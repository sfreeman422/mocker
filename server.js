const express = require('express');
const bodyParser = require('body-parser');
const mocker = require('./helpers/mock.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/mock', (req, res) => {
  console.log(req.body.text);
  const mocked = mock(req.body.text);
  res.send(mocked);
});

app.listen(PORT, (e) => {
  if (e) {
    console.error(e);
  } else {
    console.log("Successfully listening on port 3000");
  }
});