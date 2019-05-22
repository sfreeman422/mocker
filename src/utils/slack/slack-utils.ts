import axios from "axios";
import { IChannelResponse } from "../../shared/models/slack/slack-models";

export function sendResponse(
  responseUrl: string,
  response: IChannelResponse
): void {
  axios
    .post(responseUrl, response)
    .then(() =>
      console.log(`Successfully responded to: ${responseUrl}`, response)
    )
    .catch((e: Error) =>
      console.error(`Error responding: ${e.message} at ${responseUrl}`)
    );
}

export function getUserName(user: string): string {
  return user.slice(user.indexOf("|") + 1, user.length - 1);
}

export function getUserId(user: string): string {
  return user.slice(2, user.indexOf("|"));
}
