const express = require("express");
const router = express.Router();
const { define, capitalizeFirstLetter, formatDefs } = "../utils/define-utils";
const sendResponse = require("../utils/sendResponse");

router.post("/define", async (req, res) => {
  const word = req.body.text;
  const defined = await define(word);
  const response = {
    response_type: "in_channel",
    text: `*${capitalizeFirstLetter(req.body.text)}*`,
    attachments: formatDefs(defined.list)
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
