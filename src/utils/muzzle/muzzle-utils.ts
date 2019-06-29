import {
  ChatDeleteArguments,
  ChatPostMessageArguments,
  WebClient
} from "@slack/web-api";
import { IMuzzled, IMuzzler } from "../../shared/models/muzzle/muzzle-models";
import { IEventRequest } from "../../shared/models/slack/slack-models";
import { getUserId, getUserName } from "../slack/slack-utils";
// Store for the muzzled users.
export const muzzled: Map<string, IMuzzled> = new Map();
// Store for people who are muzzling others.
export const requestors: Map<string, IMuzzler> = new Map();

// Time period in which a user must wait before making more muzzles.
const MAX_MUZZLE_TIME = 3600000;
const MAX_TIME_BETWEEN_MUZZLES = 3600000;
const MAX_SUPPRESSIONS: number = 7;
const MAX_MUZZLES = 2;

export const web: WebClient = new WebClient(process.env.muzzleBotToken);

/**
 * Takes in text and randomly muzzles certain words.
 */
export function muzzle(text: string) {
  let returnText = "";
  const words = text.split(" ");
  for (const word of words) {
    returnText +=
      isRandomEven() && !containsAt(word) ? ` *${word}* ` : " ..mMm.. ";
  }
  return returnText;
}

/**
 * Determines whether or not a user is trying to @user, @channel or @here while muzzled.
 */
export function containsAt(word: string): boolean {
  return (
    word.includes("@") ||
    word.includes("<!channel>") ||
    word.includes("<!here>")
  );
}

/**
 * Gives us a random value between 30 seconds and 3 minutes.
 */
export function getTimeToMuzzle() {
  return Math.floor(Math.random() * (180000 - 30000 + 1) + 30000);
}

/**
 * Gives us a time string formatted as 1m20s to show the user.
 */
export function getTimeString(time: number) {
  const minutes = Math.floor(time / 60000);
  const seconds = ((time % 60000) / 1000).toFixed(0);
  return +seconds === 60
    ? minutes + 1 + "m00s"
    : minutes + "m" + (+seconds < 10 ? "0" : "") + seconds + "s";
}

/**
 * Returns boolean whether max muzzles have been reached.
 */
function isMaxMuzzlesReached(userId: string) {
  return (
    requestors.has(userId) &&
    requestors.get(userId)!.muzzleCount === MAX_MUZZLES
  );
}

/**
 * Returns boolean whether user is muzzled or not.
 */
export function isUserMuzzled(userId: string) {
  return muzzled.has(userId);
}

/**
 * Determines whether or not a bot message should be removed.
 */
export function shouldBotMessageBeMuzzled(request: IEventRequest) {
  return (
    request.event.subtype === "bot_message" &&
    request.event.attachments &&
    isUserMuzzled(
      getUserId(request.event.attachments[0].text || request.event.text)
    ) &&
    request.event.username !== "muzzle"
  );
}

/**
 * Adds a requestor to the requestors array with a muzzleCount to track how many muzzles have been performed, as well as a removal funciton.
 */
function setMuzzlerCount(requestorId: string) {
  const muzzleCount = requestors.has(requestorId)
    ? ++requestors.get(requestorId)!.muzzleCount
    : 1;

  if (requestors.has(requestorId)) {
    clearTimeout(requestors.get(requestorId)!
      .muzzleCountRemover as NodeJS.Timeout);
  }

  const removalFunction =
    requestors.has(requestorId) &&
    requestors.get(requestorId)!.muzzleCount === MAX_MUZZLES
      ? () => removeMuzzler(requestorId)
      : () => decrementMuzzleCount(requestorId);
  requestors.set(requestorId, {
    muzzleCount,
    muzzleCountRemover: setTimeout(removalFunction, MAX_TIME_BETWEEN_MUZZLES)
  });
}

/**
 * Adds a userId to the muzzled array, adds the requestorId to the requestorsArray, sets timeout for removeMuzzler.
 */
function muzzleUser(userId: string, requestorId: string, timeToMuzzle: number) {
  muzzled.set(userId, {
    suppressionCount: 0,
    muzzledBy: requestorId
  });

  setMuzzlerCount(requestorId);
  setTimeout(() => removeMuzzle(userId), timeToMuzzle);
}

/**
 * Adds a user to the muzzled array and sets a timeout to remove the muzzle within a random time of 30 seconds to 3 minutes
 */
export function addUserToMuzzled(userId: string, requestorId: string) {
  const userName = getUserName(userId);
  const requestorName = getUserName(requestorId);
  return new Promise((resolve, reject) => {
    if (isUserMuzzled(userId)) {
      console.error(
        `${requestorName} attempted to muzzle ${userName} but ${userName} is already muzzled.`
      );
      reject(`${userName} is already muzzled!`);
    } else if (isUserMuzzled(requestorId)) {
      console.error(
        `User: ${requestorName} attempted to muzzle ${userName} but failed because requestor: ${requestorName} is currently muzzled`
      );
      reject(`You can't muzzle someone if you are already muzzled!`);
    } else if (isMaxMuzzlesReached(requestorId)) {
      console.error(
        `User: ${requestorName} attempted to muzzle ${userName} but failed because requestor: ${requestorName} has reached maximum muzzle of ${MAX_MUZZLES}`
      );
      reject(
        `You're doing that too much. Only ${MAX_MUZZLES} muzzles are allowed per hour.`
      );
    } else {
      const timeToMuzzle = getTimeToMuzzle();
      muzzleUser(userId, requestorId, timeToMuzzle);
      console.log(
        `${userName} is now muzzled for ${timeToMuzzle} milliseconds`
      );
      resolve(
        `Succesfully muzzled ${userName} for ${getTimeString(timeToMuzzle)}`
      );
    }
  });
}

export function decrementMuzzleCount(requestorId: string) {
  if (requestors.has(requestorId)) {
    const decrementedMuzzle = --requestors.get(requestorId)!.muzzleCount;
    requestors.set(requestorId, {
      muzzleCount: decrementedMuzzle,
      muzzleCountRemover: requestors.get(requestorId)!.muzzleCountRemover
    });
    console.log(
      `Successfully decremented ${requestorId} muzzleCount to ${decrementedMuzzle}`
    );
  } else {
    console.error(
      `Attemped to decrement muzzle count for ${requestorId} but they did not exist!`
    );
  }
}

export function removeMuzzler(user: string) {
  requestors.delete(user);
  console.log(
    `${MAX_MUZZLE_TIME} has passed since ${user} last successful muzzle. They have been removed from requestors.`
  );
}

export function removeMuzzle(user: string) {
  muzzled.delete(user);
  console.log(`Removed ${user}'s muzzle! He is free at last.`);
}

export function isRandomEven() {
  return Math.floor(Math.random() * 2) % 2 === 0;
}

export function sendMuzzledMessage(
  channel: string,
  user: string,
  text: string
) {
  if (muzzled.get(user)!.suppressionCount < MAX_SUPPRESSIONS) {
    muzzled.set(user, {
      suppressionCount: ++muzzled.get(user)!.suppressionCount,
      muzzledBy: muzzled.get(user)!.muzzledBy
    });
    sendMessage(channel, `<@${user}> says "${muzzle(text)}"`);
  }
}

/**
 * Handles deletion of messages.
 */
export function deleteMessage(channel: string, ts: string) {
  const muzzleToken: any = process.env.muzzleBotToken;
  const deleteRequest: ChatDeleteArguments = {
    token: muzzleToken,
    channel,
    ts,
    as_user: true
  };

  web.chat.delete(deleteRequest).catch(e => {
    if (e.data.error === "message_not_found") {
      console.log("Message already deleted, no need to retry");
    } else {
      console.error(e);
      console.error("Retrying in 5 seconds...");
      setTimeout(() => deleteMessage(channel, ts), 5000);
    }
  });
}

/**
 * Handles sending messages to the chat.
 */
export function sendMessage(channel: string, text: string) {
  const muzzleToken: any = process.env.muzzleBotToken;
  const postRequest: ChatPostMessageArguments = {
    token: muzzleToken,
    channel,
    text
  };
  web.chat.postMessage(postRequest).catch(e => console.error(e));
}
