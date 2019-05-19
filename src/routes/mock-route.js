const express = require("express");
const { mock } = require("../utils/mock/mock-utils");
const { muzzled } = require("../utils/muzzle/muzzle-utils");
const sendResponse = require("../utils/sendResponse");

const router = express.Router();

router.post("/mock", (req, res) => {
  const mocked = mock(req.body.text);
  const response = {
    response_type: "in_channel",
    text: `<@${req.body.user_id}>`,
    attachments: [
      {
        text: mocked
      }
    ]
  };
  const isMuzzled = muzzled.includes(req.body.user_id);
  if (!isMuzzled) {
    sendResponse(req.body.response_url, response);
    res.sendStatus(200);
  } else if (isMuzzled) {
    res.send(`Sorry, can't do that while muzzled.`);
  }
});

module.exports = router;
