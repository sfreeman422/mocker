import express, { Router } from "express";
import { ISlackChannelResponse } from "../shared/models/models";
import { mock } from "../utils/mock/mock-utils";
import { isMuzzled } from "../utils/muzzle/muzzle-utils";
import { sendResponse } from "../utils/sendResponse";

export const mockRoutes: Router = express.Router();

mockRoutes.post("/mock", (req, res) => {
  const mocked: string = mock(req.body.text);
  const response: ISlackChannelResponse = {
    attachments: [
      {
        text: mocked
      }
    ],
    response_type: "in_channel",
    text: `<@${req.body.user_id}>`
  };
  if (!isMuzzled(req.body.user_id)) {
    sendResponse(req.body.response_url, response);
    res.status(200).send();
  } else if (isMuzzled(req.body.user_id)) {
    res.send(`Sorry, can't do that while muzzled.`);
  }
});
