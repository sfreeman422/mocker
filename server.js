const express = require("express");
const bodyParser = require("body-parser");
const { WebClient } = require("@slack/web-api");
const mocker = require("./helpers/mock");
const define = require("./helpers/define");
const capitalizeFirstLetter = require("./helpers/capitalizeFirstLetter");
const formatDefs = require("./helpers/formatDefs");
const sendResponse = require("./helpers/sendResponse");
const muzzleText = require("./helpers/muzzle");

const app = express();
const PORT = process.env.PORT || 3000;
const muzzleToken = process.env.muzzleBotToken;
const web = new WebClient(muzzleToken);

// test for jr
const muzzled = ["U2YJQN2KB"];

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
    text: `*${capitalizeFirstLetter(req.body.text)}*`,
    attachments: formatDefs(defined.list)
  };

  sendResponse(req.body.response_url, response);

  res.status(200);
  res.send();
});

app.post("/muzzle/handle", async (req, res) => {
  console.log(req.body.event);
  if (muzzled.includes(req.body.event.user)) {
    console.log(`${req.body.event.user} is muzzled! Suppressing his voice...`);
    const deleteRequest = {
      token: muzzleToken,
      channel: req.body.event.channel,
      ts: req.body.event.ts,
      as_user: true
    };

    const postRequest = {
      token: muzzleToken,
      channel: req.body.event.channel,
      text: `<@${req.body.event.user}> says "${muzzleText(
        req.body.event.text
      )}"`
    };

    web.chat
      .delete(deleteRequest)
      .then(response => console.log(response))
      .catch(e => console.error(e));

    web.chat
      .postMessage(postRequest)
      .then(response => console.log(response))
      .catch(e => console.error(e));
  }
  res.send({ challenge: req.body.challenge });
});

app.post("/muzzle", async (req, res) => {
  console.log(req.body.text);
});

app.listen(PORT, e => {
  if (e) {
    console.error(e);
  } else {
    console.log("Successfully listening on port 3000");
  }
});
