import { WebClient } from "@slack/web-api";
import express, { Request, Response, Router } from "express";
import {
  IDeleteMessageRequest,
  IEventRequest,
  IPostMessageRequest,
  ISlashCommandRequest
} from "../shared/models/slack/slack-models";
import {
  addUserToMuzzled,
  muzzle,
  muzzled
} from "../utils/muzzle/muzzle-utils";
import { getUserId, getUserName } from "../utils/slack/slack-utils";

export const muzzleRoutes: Router = express.Router();
const muzzleToken: any = process.env.muzzleBotToken;
const web: WebClient = new WebClient(muzzleToken);

muzzleRoutes.post("/muzzle/handle", (req: Request, res: Response) => {
  const request: IEventRequest = req.body;
  console.log(request);
  if (muzzled.has(request.event.user)) {
    console.log(`${request.event.user} is muzzled! Suppressing his voice...`);
    const deleteRequest: IDeleteMessageRequest = {
      token: muzzleToken,
      channel: request.event.channel,
      ts: request.event.ts,
      as_user: true
    };

    const postRequest: IPostMessageRequest = {
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
  const request: ISlashCommandRequest = req.body;
  const userId: string = getUserId(request.text);
  const userName: string = getUserName(request.text);
  try {
    res.send(addUserToMuzzled(userId, userName, request.user_id));
  } catch (e) {
    res.send(e.message);
  }
});
