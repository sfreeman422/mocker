const express = require("express");
const { WebClient } = require("@slack/web-api");
const { addUserToMuzzled, isMuzzled } = require("../utils/muzzle/muzzle-utils");
const getUserName = require("../utils/getUserName");
const getUserId = require("../utils/getUserId");

const router = express.Router();
const muzzleToken = process.env.muzzleBotToken;
const web = new WebClient(muzzleToken);

router.post("/muzzle/handle", (req, res) => {
  if (isMuzzled(req.body.event.user)) {
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
      text: `<@${req.body.event.user}> says "${muzzle(req.body.event.text)}"`
    };

    web.chat.delete(deleteRequest).catch(e => console.error(e));

    web.chat.postMessage(postRequest).catch(e => console.error(e));
  }
  res.send({ challenge: req.body.challenge });
});

router.post("/muzzle", (req, res) => {
  const userId = getUserId(req.body.text);
  const userName = getUserName(req.body.text);
  try {
    res.send(addUserToMuzzled(userId, userName, req.body.user_name));
  } catch (e) {
    res.send(e.message);
  }
});

module.exports = router;
