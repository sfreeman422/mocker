import { SlackChannelResponse } from "../shared/models/models";

const axios = require("axios");

export function sendResponse(
  responseUrl: string,
  response: SlackChannelResponse
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
