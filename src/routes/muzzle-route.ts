import { WebClient } from "@slack/web-api";
import express, { Request, Response, Router } from "express";
import {
  ISlackDeleteMessageRequest,
  ISlackEventRequest,
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
  const request: ISlackEventRequest = req.body;
  if (isMuzzled(request.event.user)) {
    console.log(`${request.event.user} is muzzled! Suppressing his voice...`);
    const deleteRequest: ISlackDeleteMessageRequest = {
      token: muzzleToken,
      channel: request.event.channel,
      ts: request.event.ts,
      as_user: true
    };

    const postRequest: ISlackPostMessageRequest = {
      token: muzzleToken,
      channel: request.event.channel,
      text: `<@${request.event.user}> says "${muzzle(request.event.text)}"`
    };

    web.chat.delete(deleteRequest).catch(e => console.error(e));

    web.chat.postMessage(postRequest).catch(e => console.error(e));
  }
  res.send({ challenge: request.challenge });
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
