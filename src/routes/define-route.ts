import express, { Request, Response, Router } from "express";
import {
  ISlackChannelResponse,
  ISlashCommandRequest,
  IUrbanDictionaryResponse
} from "../shared/models/models";
import {
  capitalizeFirstLetter,
  define,
  formatDefs
} from "../utils/define/define-utils";
import { isMuzzled } from "../utils/muzzle/muzzle-utils";
import { sendResponse } from "../utils/slack/slack-utils";

export const defineRoutes: Router = express.Router();

defineRoutes.post("/define", async (req: Request, res: Response) => {
  const request: ISlashCommandRequest = req.body;
  try {
    const defined: IUrbanDictionaryResponse = await define(request.text);
    const response: ISlackChannelResponse = {
      response_type: "in_channel",
      text: `*${capitalizeFirstLetter(request.text)}*`,
      attachments: formatDefs(defined.list)
    };

    if (!isMuzzled(req.body.user_id)) {
      sendResponse(req.body.response_url, response);
      res.status(200).send();
    } else if (isMuzzled(req.body.user_id)) {
      res.send(`Sorry, can't do that while muzzled.`);
    }
  } catch (e) {
    res.send(`error: ${e.message}`);
  }
});
