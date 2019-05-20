const express = require("express");
const router = express.Router();
const {
  define,
  capitalizeFirstLetter,
  formatDefs
} = require("../utils/define/define-utils");
const { isMuzzled } = require("../utils/muzzle/muzzle-utils");
const sendResponse = require("../utils/sendResponse");

router.post("/define", async (req, res) => {
  const word = req.body.text;
  console.log(word);
  try {
    const defined = await define(word);
    const response = {
      response_type: "in_channel",
      text: `*${capitalizeFirstLetter(req.body.text)}*`,
      attachments: formatDefs(defined.list)
    };

    if (!isMuzzled(req.body.user_id)) {
      console.log(response);
      sendResponse(req.body.response_url, response);
      res.status(200).send();
    } else if (isMuzzled(req.body.user_id)) {
      res.send(`Sorry, can't do that while muzzled.`);
    }
  } catch (e) {
    res.send("error: ", e.message);
  }
});

module.exports = router;
