const express = require("express");
const bodyParser = require("body-parser");
const { WebClient } = require("@slack/web-api");
const mocker = require("./helpers/mock");
const define = require("./helpers/define");
const capitalizeFirstLetter = require("./helpers/capitalizeFirstLetter");
const formatDefs = require("./helpers/formatDefs");
const sendResponse = require("./helpers/sendResponse");
const muzzleText = require("./helpers/muzzle");
const getUserId = require("./helpers/getUserId");
const getUserName = require("./helpers/getUserName");

const app = express();
const PORT = process.env.PORT || 3000;
const muzzleToken = process.env.muzzleBotToken;
const web = new WebClient(muzzleToken);

// test for jr
const muzzled = [];

function addUserToMuzzled(toMuzzle, requestor) {
  const timeToMuzzle = Math.floor(Math.random() * (180000 - 30000 + 1) + 30000);
  const minutes = Math.floor(timeToMuzzle / 60000);
  const seconds = ((timeToMuzzle % 60000) / 1000).toFixed(0);
  if (muzzled.includes(toMuzzle)) {
    console.error(
      `${requestor} attempted to muzzle ${toMuzzle} but ${toMuzzle} is already muzzled.`
    );
    throw new Error(`User is already muzzled!`);
  } else if (muzzled.includes(requestor)) {
    console.error(
      `User: ${requestor} attempted to muzzle ${toMuzzle} but failed because requestor: ${requestor} is currently muzzled`
    );
    throw new Error(`You can't muzzle someone if you are already muzzled!`);
  } else {
    muzzled.push(toMuzzle);
    setTimeout(() => removeMuzzle(toMuzzle), 300000);
    return `Succesfully muzzled ${toMuzzle} for ${
      seconds == 60
        ? minutes + 1 + ":00"
        : minutes + ":" + (seconds < 10 ? "0" : "") + seconds
    } minutes`;
  }
}

function removeMuzzle(user) {
  console.log(`Attempting to remove ${user}'s muzzle...`);
  muzzled.splice(muzzled.indexOf(user), 1);
  console.log(`Removed ${user}'s muzzle! He is free at last.`);
}

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

    web.chat.delete(deleteRequest).catch(e => console.error(e));

    web.chat.postMessage(postRequest).catch(e => console.error(e));
  }
  res.send({ challenge: req.body.challenge });
});

app.post("/muzzle", async (req, res) => {
  console.log(req.body);
  const userId = getUserId(req.body.text);
  const userName = getUserName(req.body.text);
  try {
    res.send(addUserToMuzzled(userId, req.body.user_name));
  } catch (e) {
    res.send(e.message);
  }
});

app.listen(PORT, e => {
  if (e) {
    console.error(e);
  } else {
    console.log("Successfully listening on port 3000");
  }
});
