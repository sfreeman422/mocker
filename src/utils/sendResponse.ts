import axios from "axios";
import { ISlackChannelResponse } from "../shared/models/models";

export function sendResponse(
  responseUrl: string,
  response: ISlackChannelResponse
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
