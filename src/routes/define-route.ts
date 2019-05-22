import express, { Request, Response, Router } from "express";
import {
  ISlackChannelResponse,
  IUrbanDictionaryResponse
} from "../shared/models/models";
import {
  capitalizeFirstLetter,
  define,
  formatDefs
} from "../utils/define/define-utils";
import { isMuzzled } from "../utils/muzzle/muzzle-utils";
import { sendResponse } from "../utils/sendResponse";

export const defineRoutes: Router = express.Router();

defineRoutes.post("/define", async (req: Request, res: Response) => {
  const word: string = req.body.text;
  try {
    const defined: IUrbanDictionaryResponse = await define(word);
    const response: ISlackChannelResponse = {
      response_type: "in_channel",
      text: `*${capitalizeFirstLetter(req.body.text)}*`,
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
