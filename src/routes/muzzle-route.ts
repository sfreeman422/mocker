import { WebClient } from "@slack/web-api";
import express, { Request, Response, Router } from "express";
import {
  ISlackDeleteMessageRequest,
  ISlackPostMessageRequest
} from "../shared/models/models";
import {
  addUserToMuzzled,
  isMuzzled,
  muzzle
} from "../utils/muzzle/muzzle-utils";
import { getUserId, getUserName } from "../utils/slack/slack-utils";

export const muzzleRoutes: Router = express.Router();
const muzzleToken: any = process.env.muzzleBotToken;
const web: WebClient = new WebClient(muzzleToken);

muzzleRoutes.post("/muzzle/handle", (req: Request, res: Response) => {
  if (isMuzzled(req.body.event.user)) {
    console.log(`${req.body.event.user} is muzzled! Suppressing his voice...`);
    const deleteRequest: ISlackDeleteMessageRequest = {
      token: muzzleToken,
      channel: req.body.event.channel,
      ts: req.body.event.ts,
      as_user: true
    };

    const postRequest: ISlackPostMessageRequest = {
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
