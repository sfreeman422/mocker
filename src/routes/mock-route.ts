import express, { Router } from "express";
import {
  IChannelResponse,
  ISlashCommandRequest
} from "../shared/models/slack/slack-models";
import { mock } from "../utils/mock/mock-utils";
import { isMuzzled } from "../utils/muzzle/muzzle-utils";
import { sendResponse } from "../utils/slack/slack-utils";

export const mockRoutes: Router = express.Router();

mockRoutes.post("/mock", (req, res) => {
  const request: ISlashCommandRequest = req.body;
  const mocked: string = mock(request.text);
  const response: IChannelResponse = {
    attachments: [
      {
        text: mocked
      }
    ],
    response_type: "in_channel",
    text: `<@${request.user_id}>`
  };
  if (!isMuzzled(request.user_id)) {
    sendResponse(request.response_url, response);
    res.status(200).send();
  } else if (isMuzzled(request.user_id)) {
    res.send(`Sorry, can't do that while muzzled.`);
  }
});
