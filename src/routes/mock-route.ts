import express, { Router } from "express";
const { mock } = require("../utils/mock/mock-utils");
const { isMuzzled } = require("../utils/muzzle/muzzle-utils");
const sendResponse = require("../utils/sendResponse");

export const mockRoutes: Router = express.Router();

mockRoutes.post("/mock", (req, res) => {
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
  if (!isMuzzled(req.body.user_id)) {
    sendResponse(req.body.response_url, response);
    res.status(200).send();
  } else if (isMuzzled(req.body.user_id)) {
    res.send(`Sorry, can't do that while muzzled.`);
  }
});
