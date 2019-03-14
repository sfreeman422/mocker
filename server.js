const express = require("express");
const bodyParser = require("body-parser");
const mocker = require("./helpers/mock");
const define = require("./helpers/define");
const capitalizeFirstLetter = require("./helpers/capitalizeFirstLetter");
const formatDefs = require("./helpers/formatDefs");
const sendResponse = require("./helpers/sendResponse");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post("/mock", (req, res) => {
  console.log(req.body);
  const mocked = mocker(req.body.text);
  const response = {
    response_type: "in_channel",
    text: `<@${req.body.user_id}>`,
    attachments: [
      {
        text: mocked
      }
    ]
  };

  sendResponse(req.body.response_url, response);

  res.status(200);
  res.send();
});

app.post("/define", async (req, res) => {
  console.log(req.body.text);
  console.log(process.env.dictKey);

  const word = req.body.text;
  const defined = await define(word);

  const response = {
    response_type: "in_channel",
    text: `*${capitalizeFirstLetter(req.body.text)}* \n Definitions:`,
    attachments: formatDefs(defined[0].shortdef)
  };

  sendResponse(req.body.response_url, response);

  console.log("sending the 200");
  res.status(200);
  res.send();
});

app.listen(PORT, e => {
  if (e) {
    console.error(e);
  } else {
    console.log("Successfully listening on port 3000");
  }
});
