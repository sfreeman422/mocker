import { BackfireItem } from '../../shared/models/backfire/backfire.model';
import { EventRequest } from '../../shared/models/slack/slack-models';
import { MAX_SUPPRESSIONS, REPLACEMENT_TEXT } from '../muzzle/constants';
import { isRandomEven } from '../muzzle/muzzle-utilities';
import { SlackService } from '../slack/slack.service';
import { WebService } from '../web/web.service';
import { BackFirePersistenceService } from './backfire.persistence.service';
import { USER_ID_REGEX } from './constants';

export class BackfireService {
  private webService = WebService.getInstance();
  private slackService = SlackService.getInstance();
  private backfirePersistenceService = BackFirePersistenceService.getInstance();

  /**
   * Takes in text and randomly muzzles words.
   */
  public backfireMessage(text: string, backfireId: number): string {
    const words = text.split(' ');

    let returnText = '';
    let wordsSuppressed = 0;
    let charactersSuppressed = 0;
    let replacementWord;

    for (let i = 0; i < words.length; i++) {
      replacementWord = this.getReplacementWord(
        words[i],
        i === 0,
        i === words.length - 1,
        REPLACEMENT_TEXT[Math.floor(Math.random() * REPLACEMENT_TEXT.length)],
      );
      if (replacementWord.includes(REPLACEMENT_TEXT[Math.floor(Math.random() * REPLACEMENT_TEXT.length)])) {
        wordsSuppressed++;
        charactersSuppressed += words[i].length;
      }
      returnText += replacementWord;
    }
    this.backfirePersistenceService.incrementMessageSuppressions(backfireId);
    this.backfirePersistenceService.incrementCharacterSuppressions(backfireId, charactersSuppressed);
    this.backfirePersistenceService.incrementWordSuppressions(backfireId, wordsSuppressed);
    return returnText;
  }

  public addBackfireTime(userId: string, time: number): void {
    this.backfirePersistenceService.addBackfireTime(userId, time);
  }

  public sendBackfiredMessage(channel: string, userId: string, text: string, timestamp: string): void {
    const backfire: BackfireItem | undefined = this.backfirePersistenceService.getBackfireByUserId(userId);
    if (backfire) {
      this.webService.deleteMessage(channel, timestamp);
      if (backfire!.suppressionCount < MAX_SUPPRESSIONS) {
        this.backfirePersistenceService.setBackfire(userId, {
          suppressionCount: ++backfire!.suppressionCount,
          id: backfire!.id,
          removalFn: backfire!.removalFn,
        });
        this.webService.sendMessage(channel, `<@${userId}> says "${this.backfireMessage(text, backfire!.id)}"`);
      } else {
        this.backfirePersistenceService.trackDeletedMessage(backfire!.id, text);
      }
    }
  }

  public getBackfire(userId: string): BackfireItem | undefined {
    return this.backfirePersistenceService.getBackfireByUserId(userId);
  }

  public trackDeletedMessage(id: number, text: string): void {
    this.backfirePersistenceService.trackDeletedMessage(id, text);
  }

  public findUserIdInBlocks(obj: any, regEx: RegExp): string | undefined {
    let id;
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string') {
        const found = obj[key].match(regEx);
        if (found) {
          id = obj[key];
        }
      }
      if (typeof obj[key] === 'object') {
        id = this.findUserIdInBlocks(obj[key], regEx);
      }
    });
    return id;
  }

  /**
   * Determines whether or not a bot message should be removed.
   */
  public shouldBotMessageBeMuzzled(request: EventRequest): boolean {
    if (
      (request.event.bot_id || request.event.subtype === 'bot_message') &&
      (!request.event.username || request.event.username.toLowerCase() !== 'muzzle')
    ) {
      let userIdByEventText;
      let userIdByAttachmentText;
      let userIdByAttachmentPretext;
      let userIdByCallbackId;
      let userIdByBlocks;

      if (request.event.blocks) {
        const hasIdInBlock = this.findUserIdInBlocks(request.event.blocks, USER_ID_REGEX);
        if (hasIdInBlock) {
          userIdByBlocks = this.slackService.getUserId(hasIdInBlock);
        }
      }

      if (request.event.text) {
        userIdByEventText = this.slackService.getUserId(request.event.text);
      }

      if (request.event.attachments && request.event.attachments.length) {
        userIdByAttachmentText = this.slackService.getUserId(request.event.attachments[0].text);
        userIdByAttachmentPretext = this.slackService.getUserId(request.event.attachments[0].pretext);

        if (request.event.attachments[0].callback_id) {
          userIdByCallbackId = this.slackService.getUserIdByCallbackId(request.event.attachments[0].callback_id);
        }
      }

      const finalUserId = this.slackService.getBotId(
        userIdByEventText,
        userIdByAttachmentText,
        userIdByAttachmentPretext,
        userIdByCallbackId,
        userIdByBlocks,
      );
      console.log(finalUserId);
      return !!(finalUserId && this.backfirePersistenceService.isBackfire(finalUserId));
    }
    return false;
  }

  private getReplacementWord(word: string, isFirstWord: boolean, isLastWord: boolean, replacementText: string): string {
    const text =
      isRandomEven() && word.length < 10 && word !== ' ' && !this.slackService.containsTag(word)
        ? `*${word}*`
        : replacementText;

    if ((isFirstWord && !isLastWord) || (!isFirstWord && !isLastWord)) {
      return `${text} `;
    }
    return text;
  }
}
