import express, { Router, Request, Response } from "express";
import { WebClient } from "@slack/web-api";
import {
  addUserToMuzzled,
  isMuzzled,
  muzzle
} from "../utils/muzzle/muzzle-utils";
import { getUserName } from "../utils/getUserName";
import { getUserId } from "../utils/getUserId";
import {
  SlackDeleteMessageRequest,
  SlackPostMessageRequest
} from "../shared/models/models";

export const muzzleRoutes: Router = express.Router();
const muzzleToken: any = process.env.muzzleBotToken;
const web: WebClient = new WebClient(muzzleToken);

muzzleRoutes.post("/muzzle/handle", (req: Request, res: Response) => {
  if (isMuzzled(req.body.event.user)) {
    console.log(`${req.body.event.user} is muzzled! Suppressing his voice...`);
    const deleteRequest: SlackDeleteMessageRequest = {
      token: muzzleToken,
      channel: req.body.event.channel,
      ts: req.body.event.ts,
      as_user: true
    };

    const postRequest: SlackPostMessageRequest = {
      token: muzzleToken,
      channel: req.body.event.channel,
      text: `<@${req.body.event.user}> says "${muzzle(req.body.event.text)}"`
    };

    web.chat.delete(deleteRequest).catch(e => console.error(e));

    web.chat.postMessage(postRequest).catch(e => console.error(e));
  }
  res.send({ challenge: req.body.challenge });
});

muzzleRoutes.post("/muzzle", (req: Request, res: Response) => {
  const userId: string = getUserId(req.body.text);
  const userName: string = getUserName(req.body.text);
  try {
    res.send(addUserToMuzzled(userId, userName, req.body.user_name));
  } catch (e) {
    res.send(e.message);
  }
});
