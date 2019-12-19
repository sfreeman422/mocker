import express, { Request, Response, Router } from "express";
import { DefineService } from "../services/define/define.service";
import { MuzzlePersistenceService } from "../services/muzzle/muzzle.persistence.service";
import { SlackService } from "../services/slack/slack.service";
import { IUrbanDictionaryResponse } from "../shared/models/define/define-models";
import {
  IChannelResponse,
  ISlashCommandRequest
} from "../shared/models/slack/slack-models";

export const defineController: Router = express.Router();
const muzzlePersistenceService = MuzzlePersistenceService.getInstance();
const slackService = SlackService.getInstance();
const defineService = DefineService.getInstance();

defineController.post("/define", async (req: Request, res: Response) => {
  const request: ISlashCommandRequest = req.body;

  if (muzzlePersistenceService.isUserMuzzled(request.user_id)) {
    res.send(`Sorry, can't do that while muzzled.`);
  } else {
    const defined: IUrbanDictionaryResponse = (await defineService
      .define(request.text)
      .catch(e => {
        res.send(`Error: ${e.message}`);
      })) as IUrbanDictionaryResponse;
    const response: IChannelResponse = {
      response_type: "in_channel",
      text: `*${defineService.capitalizeFirstLetter(request.text)}*`,
      attachments: defineService.formatDefs(defined.list)
    };
    slackService.sendResponse(request.response_url, response);
    res.status(200).send();
  }
});
