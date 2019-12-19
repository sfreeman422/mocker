import { IMuzzled } from "../../shared/models/muzzle/muzzle-models";
import { IEventRequest } from "../../shared/models/slack/slack-models";
import { SlackService } from "../slack/slack.service";
import { WebService } from "../web/web.service";
import { MAX_MUZZLES, MAX_SUPPRESSIONS } from "./constants";
import {
  getTimeString,
  getTimeToMuzzle,
  isRandomEven,
  shouldBackfire
} from "./muzzle-utilities";
import { MuzzlePersistenceService } from "./muzzle.persistence.service";

export class MuzzleService {
  private webService = WebService.getInstance();
  private slackService = SlackService.getInstance();
  private muzzlePersistenceService = MuzzlePersistenceService.getInstance();

  /**
   * Takes in text and randomly muzzles certain words.
   */
  public muzzle(text: string, muzzleId: number, isBackfire: boolean) {
    const replacementText = "..mMm..";
    const words = text.split(" ");

    let returnText = "";
    let wordsSuppressed = 0;
    let charactersSuppressed = 0;
    let replacementWord;

    for (let i = 0; i < words.length; i++) {
      replacementWord = this.getReplacementWord(
        words[i],
        i === 0,
        i === words.length - 1,
        replacementText
      );
      if (replacementWord === replacementText) {
        wordsSuppressed++;
        charactersSuppressed += words[i].length;
      }
      returnText += replacementWord;
    }
    this.muzzlePersistenceService.incrementMessageSuppressions(
      muzzleId,
      isBackfire
    );
    this.muzzlePersistenceService.incrementCharacterSuppressions(
      muzzleId,
      charactersSuppressed,
      isBackfire
    );
    this.muzzlePersistenceService.incrementWordSuppressions(
      muzzleId,
      wordsSuppressed,
      isBackfire
    );
    return returnText;
  }

  /**
   * Determines whether or not a bot message should be removed.
   */
  public shouldBotMessageBeMuzzled(request: IEventRequest) {
    let userIdByEventText;
    let userIdByAttachmentText;
    let userIdByAttachmentPretext;
    let userIdByCallbackId;

    if (request.event.text) {
      userIdByEventText = this.slackService.getUserId(request.event.text);
    }

    if (request.event.attachments && request.event.attachments.length) {
      userIdByAttachmentText = this.slackService.getUserId(
        request.event.attachments[0].text
      );
      userIdByAttachmentPretext = this.slackService.getUserId(
        request.event.attachments[0].pretext
      );

      if (request.event.attachments[0].callback_id) {
        userIdByCallbackId = this.slackService.getUserIdByCallbackId(
          request.event.attachments[0].callback_id
        );
      }
    }

    const finalUserId = this.slackService.getBotId(
      userIdByEventText,
      userIdByAttachmentText,
      userIdByAttachmentPretext,
      userIdByCallbackId
    );

    return !!(
      request.event.subtype === "bot_message" &&
      finalUserId &&
      this.muzzlePersistenceService.isUserMuzzled(finalUserId) &&
      request.event.username !== "muzzle"
    );
  }

  /**
   * Adds a user to the muzzled map and sets a timeout to remove the muzzle within a random time of 30 seconds to 3 minutes
   */
  public addUserToMuzzled(
    userId: string,
    requestorId: string,
    channel: string
  ) {
    const shouldBackFire = shouldBackfire();
    const userName = this.slackService.getUserName(userId);
    const requestorName = this.slackService.getUserName(requestorId);
    return new Promise(async (resolve, reject) => {
      if (!userId) {
        reject(
          `Invalid username passed in. You can only muzzle existing slack users`
        );
      } else if (this.muzzlePersistenceService.isUserMuzzled(userId)) {
        console.error(
          `${requestorName} | ${requestorId} attempted to muzzle ${userName} | ${userId} but ${userName} | ${userId} is already muzzled.`
        );
        reject(`${userName} is already muzzled!`);
      } else if (this.muzzlePersistenceService.isUserMuzzled(requestorId)) {
        console.error(
          `User: ${requestorName} | ${requestorId}  attempted to muzzle ${userName} | ${userId} but failed because requestor: ${requestorName} | ${requestorId}  is currently muzzled`
        );
        reject(`You can't muzzle someone if you are already muzzled!`);
      } else if (
        this.muzzlePersistenceService.isMaxMuzzlesReached(requestorId)
      ) {
        console.error(
          `User: ${requestorName} | ${requestorId}  attempted to muzzle ${userName} | ${userId} but failed because requestor: ${requestorName} | ${requestorId} has reached maximum muzzle of ${MAX_MUZZLES}`
        );
        reject(
          `You're doing that too much. Only ${MAX_MUZZLES} muzzles are allowed per hour.`
        );
      } else if (shouldBackFire) {
        console.log(
          `Backfiring on ${requestorName} | ${requestorId} for attempting to muzzle ${userName} | ${userId}`
        );
        const timeToMuzzle = getTimeToMuzzle();
        await this.muzzlePersistenceService
          .addBackfire(requestorId, timeToMuzzle)
          .then(() => {
            this.webService.sendMessage(
              channel,
              `:boom: <@${requestorId}> attempted to muzzle <@${userId}> but it backfired! :boom:`
            );
            resolve(`:boom: Backfired! Better luck next time... :boom:`);
          })
          .catch((e: any) => {
            console.error(e);
            reject(`Muzzle failed!`);
          });
      } else {
        const timeToMuzzle = getTimeToMuzzle();
        await this.muzzlePersistenceService
          .addMuzzle(requestorId, userId, timeToMuzzle)
          .then(() => {
            resolve(
              `Successfully muzzled ${userName} for ${getTimeString(
                timeToMuzzle
              )}`
            );
          })
          .catch((e: any) => {
            console.error(e);
            reject(`Muzzle failed!`);
          });
      }
    });
  }

  /**
   * Wrapper for sendMessage that handles suppression in memory and, if max suppressions are reached, handles suppression storage to disk.
   */
  public sendMuzzledMessage(
    channel: string,
    userId: string,
    text: string,
    timestamp: string
  ) {
    const muzzle:
      | IMuzzled
      | undefined = this.muzzlePersistenceService.getMuzzle(userId);
    if (muzzle) {
      const isBackfire = muzzle!.isBackfire;
      this.webService.deleteMessage(channel, timestamp);
      if (muzzle!.suppressionCount < MAX_SUPPRESSIONS) {
        this.muzzlePersistenceService.setMuzzle(userId, {
          suppressionCount: ++muzzle!.suppressionCount,
          muzzledBy: muzzle!.muzzledBy,
          id: muzzle!.id,
          isBackfire,
          removalFn: muzzle!.removalFn
        });
        this.webService.sendMessage(
          channel,
          `<@${userId}> says "${this.muzzle(text, muzzle!.id, isBackfire)}"`
        );
      } else {
        this.muzzlePersistenceService.trackDeletedMessage(
          muzzle!.id,
          text,
          isBackfire
        );
      }
    }
  }

  private getReplacementWord(
    word: string,
    isFirstWord: boolean,
    isLastWord: boolean,
    replacementText: string
  ) {
    if (
      isRandomEven() &&
      word.length < 10 &&
      word !== " " &&
      !this.slackService.containsTag(word)
    ) {
      return `*${word}*`;
    } else if (isFirstWord && !isLastWord) {
      return `${replacementText} `;
    } else if (isLastWord) {
      return replacementText;
    } else {
      return `${replacementText} `;
    }
  }
}
