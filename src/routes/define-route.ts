import express, { Router, Request, Response } from "express";
import {
  DefinitionResponse,
  UrbanDictionaryResponse
} from "../shared/models/models";
import {
  define,
  capitalizeFirstLetter,
  formatDefs
} from "../utils/define/define-utils";
import { isMuzzled } from "../utils/muzzle/muzzle-utils";
import { sendResponse } from "../utils/sendResponse";

export const defineRoutes: Router = express.Router();

defineRoutes.post("/define", async (req: Request, res: Response) => {
  const word: string = req.body.text;
  try {
    const defined: UrbanDictionaryResponse = await define(word);
    const response: DefinitionResponse = {
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
