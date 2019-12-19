import moment from "moment";
import { getRepository } from "typeorm";
import { Backfire } from "../../shared/db/models/Backfire";
import { Muzzle } from "../../shared/db/models/Muzzle";
import {
  IMuzzled,
  IReportRange,
  IRequestor,
  ReportType
} from "../../shared/models/muzzle/muzzle-models";
import {
  ABUSE_PENALTY_TIME,
  MAX_MUZZLE_TIME,
  MAX_MUZZLES,
  MAX_TIME_BETWEEN_MUZZLES
} from "./constants";
import { getRemainingTime } from "./muzzle-utilities";

export class MuzzlePersistenceService {
  public static getInstance() {
    if (!MuzzlePersistenceService.instance) {
      MuzzlePersistenceService.instance = new MuzzlePersistenceService();
    }
    return MuzzlePersistenceService.instance;
  }

  private static instance: MuzzlePersistenceService;
  private muzzled: Map<string, IMuzzled> = new Map();
  private requestors: Map<string, IRequestor> = new Map();

  private constructor() {}

  public addMuzzle(requestorId: string, muzzledId: string, time: number) {
    return new Promise(async (resolve, reject) => {
      const muzzle = new Muzzle();
      muzzle.requestorId = requestorId;
      muzzle.muzzledId = muzzledId;
      muzzle.messagesSuppressed = 0;
      muzzle.wordsSuppressed = 0;
      muzzle.charactersSuppressed = 0;
      muzzle.milliseconds = time;
      await getRepository(Muzzle)
        .save(muzzle)
        .then(muzzleFromDb => {
          this.muzzled.set(muzzledId, {
            suppressionCount: 0,
            muzzledBy: requestorId,
            id: muzzleFromDb.id,
            isBackfire: false,
            removalFn: setTimeout(() => this.removeMuzzle(muzzledId), time)
          });
          this.setRequestorCount(requestorId);
          resolve();
        })
        .catch(e => reject(e));
    });
  }

  /**
   * Adds a requestor to the requestors map with a muzzleCount to track how many muzzles have been performed, as well as a removal function.
   */
  public setRequestorCount(requestorId: string) {
    const muzzleCount = this.requestors.has(requestorId)
      ? ++this.requestors.get(requestorId)!.muzzleCount
      : 1;

    if (this.requestors.has(requestorId)) {
      clearTimeout(this.requestors.get(requestorId)!
        .muzzleCountRemover as NodeJS.Timeout);
    }

    const removalFunction =
      this.requestors.has(requestorId) &&
      this.requestors.get(requestorId)!.muzzleCount === MAX_MUZZLES
        ? () => this.removeRequestor(requestorId)
        : () => this.decrementMuzzleCount(requestorId);
    this.requestors.set(requestorId, {
      muzzleCount,
      muzzleCountRemover: setTimeout(removalFunction, MAX_TIME_BETWEEN_MUZZLES)
    });
  }
  /**
   * Returns boolean whether max muzzles have been reached.
   */
  public isMaxMuzzlesReached(userId: string) {
    return (
      this.requestors.has(userId) &&
      this.requestors.get(userId)!.muzzleCount === MAX_MUZZLES
    );
  }

  public addBackfire(muzzledId: string, time: number) {
    const backfire = new Backfire();
    backfire.muzzledId = muzzledId;
    backfire.messagesSuppressed = 0;
    backfire.wordsSuppressed = 0;
    backfire.charactersSuppressed = 0;
    backfire.milliseconds = time;

    return getRepository(Backfire)
      .save(backfire)
      .then(backfireFromDb => {
        this.muzzled.set(muzzledId, {
          suppressionCount: 0,
          muzzledBy: muzzledId,
          id: backfireFromDb.id,
          isBackfire: true,
          removalFn: setTimeout(() => this.removeMuzzle(muzzledId), time)
        });
        this.setRequestorCount(muzzledId);
      });
  }

  /**
   * Adds the specified amount of time to a specified muzzled user.
   */
  public addMuzzleTime(userId: string, timeToAdd: number, isBackfire: boolean) {
    if (userId && this.muzzled.has(userId)) {
      const removalFn = this.muzzled.get(userId)!.removalFn;
      const newTime = getRemainingTime(removalFn) + timeToAdd;
      const muzzleId = this.muzzled.get(userId)!.id;
      this.incrementMuzzleTime(muzzleId, ABUSE_PENALTY_TIME, isBackfire);
      clearTimeout(this.muzzled.get(userId)!.removalFn);
      console.log(`Setting ${userId}'s muzzle time to ${newTime}`);
      this.muzzled.set(userId, {
        suppressionCount: this.muzzled.get(userId)!.suppressionCount,
        muzzledBy: this.muzzled.get(userId)!.muzzledBy,
        id: this.muzzled.get(userId)!.id,
        isBackfire: this.muzzled.get(userId)!.isBackfire,
        removalFn: setTimeout(() => this.removeMuzzle(userId), newTime)
      });
    }
  }

  public setMuzzle(userId: string, options: IMuzzled) {
    this.muzzled.set(userId, options);
  }

  public getMuzzle(userId: string) {
    return this.muzzled.get(userId);
  }
  /**
   * Gets the corresponding database ID for the user's current muzzle.
   */
  public getMuzzleId(userId: string) {
    return this.muzzled.get(userId)!.id;
  }

  /**
   * Returns boolean whether user is muzzled or not.
   */
  public isUserMuzzled(userId: string): boolean {
    return this.muzzled.has(userId);
  }

  /**
   * Retrieves whether or not a muzzle is backfired.
   */
  public getIsBackfire(userId: string) {
    return this.muzzled.has(userId) && this.muzzled.get(userId)!.isBackfire;
  }

  public incrementMuzzleTime(id: number, ms: number, isBackfire: boolean) {
    return getRepository(isBackfire ? Backfire : Muzzle).increment(
      { id },
      "milliseconds",
      ms
    );
  }

  public incrementMessageSuppressions(id: number, isBackfire: boolean) {
    return getRepository(isBackfire ? Backfire : Muzzle).increment(
      { id },
      "messagesSuppressed",
      1
    );
  }

  public incrementWordSuppressions(
    id: number,
    suppressions: number,
    isBackfire: boolean
  ) {
    return getRepository(isBackfire ? Backfire : Muzzle).increment(
      { id },
      "wordsSuppressed",
      suppressions
    );
  }

  public getRange(reportType: ReportType) {
    const range: IReportRange = {
      reportType
    };

    if (reportType === ReportType.AllTime) {
      range.reportType = ReportType.AllTime;
    } else if (reportType === ReportType.Week) {
      range.start = moment()
        .startOf("week")
        .subtract(1, "week")
        .format("YYYY-MM-DD HH:mm:ss");
      range.end = moment()
        .endOf("week")
        .subtract(1, "week")
        .format("YYYY-MM-DD HH:mm:ss");
    } else if (reportType === ReportType.Month) {
      range.start = moment()
        .startOf("month")
        .subtract(1, "month")
        .format("YYYY-MM-DD HH:mm:ss");
      range.end = moment()
        .endOf("month")
        .subtract(1, "month")
        .format("YYYY-MM-DD HH:mm:ss");
    } else if (reportType === ReportType.Trailing30) {
      range.start = moment()
        .startOf("day")
        .subtract(30, "days")
        .format("YYYY-MM-DD HH:mm:ss");
      range.end = moment().format("YYYY-MM-DD HH:mm:ss");
    } else if (reportType === ReportType.Year) {
      range.start = moment()
        .startOf("year")
        .format("YYYY-MM-DD HH:mm:ss");
      range.end = moment()
        .endOf("year")
        .format("YYYY-MM-DD HH:mm:ss");
    }

    return range;
  }

  public incrementCharacterSuppressions(
    id: number,
    charactersSuppressed: number,
    isBackfire: boolean
  ) {
    return getRepository(isBackfire ? Backfire : Muzzle).increment(
      { id },
      "charactersSuppressed",
      charactersSuppressed
    );
  }
  /**
   * Determines suppression counts for messages that are ONLY deleted and not muzzled.
   * Used when a muzzled user has hit their max suppressions or when they have tagged channel.
   */
  public trackDeletedMessage(
    muzzleId: number,
    text: string,
    isBackfire: boolean
  ) {
    const words = text.split(" ").length;
    const characters = text.split("").length;
    this.incrementMessageSuppressions(muzzleId, isBackfire);
    this.incrementWordSuppressions(muzzleId, words, isBackfire);
    this.incrementCharacterSuppressions(muzzleId, characters, isBackfire);
  }

  /** Wrapper to generate a generic muzzle report in */
  public async retrieveMuzzleReport(
    reportType: ReportType = ReportType.AllTime
  ) {
    const range: IReportRange = this.getRange(reportType);

    const mostMuzzledByInstances = await this.getMostMuzzledByInstances(range);
    const mostMuzzledByMessages = await this.getMostMuzzledByMessages(range);
    const mostMuzzledByWords = await this.getMostMuzzledByWords(range);
    const mostMuzzledByChars = await this.getMostMuzzledByChars(range);
    const mostMuzzledByTime = await this.getMostMuzzledByTime(range);

    const muzzlerByInstances = await this.getMuzzlerByInstances(range);
    const muzzlerByMessages = await this.getMuzzlerByMessages(range);
    const muzzlerByWords = await this.getMuzzlerByWords(range);
    const muzzlerByChars = await this.getMuzzlerByChars(range);
    const muzzlerByTime = await this.getMuzzlerByTime(range);

    const accuracy = await this.getAccuracy(range);
    const kdr = await this.getKdr(range);

    const rawNemesis = await this.getNemesisByRaw(range);
    const successNemesis = await this.getNemesisBySuccessful(range);

    return {
      muzzled: {
        byInstances: mostMuzzledByInstances,
        byMessages: mostMuzzledByMessages,
        byWords: mostMuzzledByWords,
        byChars: mostMuzzledByChars,
        byTime: mostMuzzledByTime
      },
      muzzlers: {
        byInstances: muzzlerByInstances,
        byMessages: muzzlerByMessages,
        byWords: muzzlerByWords,
        byChars: muzzlerByChars,
        byTime: muzzlerByTime
      },
      accuracy,
      kdr,
      rawNemesis,
      successNemesis
    };
  }

  /**
   * Removes a requestor from the map.
   */
  private removeRequestor(userId: string) {
    this.requestors.delete(userId);
    console.log(
      `${MAX_MUZZLE_TIME} has passed since ${userId} last successful muzzle. They have been removed from requestors.`
    );
  }

  /**
   * Removes a muzzle from the specified user.
   */
  private removeMuzzle(userId: string) {
    this.muzzled.delete(userId);
    console.log(`Removed ${userId}'s muzzle! He is free at last.`);
  }

  /**
   * Decrements the muzzleCount on a requestor.
   */
  private decrementMuzzleCount(requestorId: string) {
    if (this.requestors.has(requestorId)) {
      const decrementedMuzzle = --this.requestors.get(requestorId)!.muzzleCount;
      this.requestors.set(requestorId, {
        muzzleCount: decrementedMuzzle,
        muzzleCountRemover: this.requestors.get(requestorId)!.muzzleCountRemover
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

  private getMostMuzzledByInstances(range: IReportRange) {
    const query =
      range.reportType === ReportType.AllTime
        ? `SELECT muzzledId, COUNT(*) as count FROM muzzle GROUP BY muzzledId ORDER BY count DESC;`
        : `SELECT muzzledId, COUNT(*) as count FROM muzzle WHERE createdAt >= '${
            range.start
          }' AND createdAt < '${
            range.end
          }' GROUP BY muzzledId ORDER BY count DESC;`;

    return getRepository(Muzzle).query(query);
  }

  private getMuzzlerByInstances(range: IReportRange) {
    const query =
      range.reportType === ReportType.AllTime
        ? `SELECT requestorId, COUNT(*) as instanceCount FROM muzzle GROUP BY requestorId ORDER BY instanceCount DESC;`
        : `SELECT requestorId, COUNT(*) as instanceCount FROM muzzle WHERE createdAt >= '${
            range.start
          }' AND createdAt < '${
            range.end
          }' GROUP BY requestorId ORDER BY instanceCount DESC;`;

    return getRepository(Muzzle).query(query);
  }

  private getMuzzlerByMessages(range: IReportRange) {
    const query =
      range.reportType === ReportType.AllTime
        ? `SELECT requestorId, SUM(messagesSuppressed) as messagesSuppressed FROM muzzle GROUP BY requestorId ORDER BY messagesSuppressed DESC;`
        : `SELECT requestorId, SUM(messagesSuppressed) as messagesSuppressed FROM muzzle WHERE createdAt >= '${
            range.start
          }' AND createdAt < '${
            range.end
          }' GROUP BY requestorId ORDER BY messagesSuppressed DESC;`;

    return getRepository(Muzzle).query(query);
  }

  private getMostMuzzledByMessages(range: IReportRange) {
    const query =
      range.reportType === ReportType.AllTime
        ? `SELECT muzzledId, SUM(messagesSuppressed) as messagesSuppressed FROM muzzle GROUP BY muzzledId ORDER BY messagesSuppressed DESC;`
        : `SELECT muzzledId, SUM(messagesSuppressed) as messagesSuppressed FROM muzzle WHERE createdAt >= '${
            range.start
          }' AND createdAt < '${
            range.end
          }' GROUP BY muzzledId ORDER BY messagesSuppressed DESC;`;

    return getRepository(Muzzle).query(query);
  }

  private getMostMuzzledByWords(range: IReportRange) {
    const query =
      range.reportType === ReportType.AllTime
        ? `SELECT muzzledId, SUM(wordsSuppressed) as wordsSuppressed FROM muzzle GROUP BY muzzledId ORDER BY wordsSuppressed DESC;`
        : `SELECT muzzledId, SUM(wordsSuppressed) as wordsSuppressed FROM muzzle WHERE createdAt >= '${
            range.start
          }' AND createdAt < '${
            range.end
          }' GROUP BY muzzledId ORDER BY wordsSuppressed DESC;`;

    return getRepository(Muzzle).query(query);
  }

  private getMuzzlerByWords(range: IReportRange) {
    const query =
      range.reportType === ReportType.AllTime
        ? `SELECT requestorId, SUM(wordsSuppressed) as wordsSuppressed FROM muzzle GROUP BY requestorId ORDER BY wordsSuppressed DESC;`
        : `SELECT requestorId, SUM(wordsSuppressed) as wordsSuppressed FROM muzzle WHERE createdAt >= '${
            range.start
          }' AND createdAt < '${
            range.end
          }' GROUP BY requestorId ORDER BY wordsSuppressed DESC;`;

    return getRepository(Muzzle).query(query);
  }

  private getMostMuzzledByChars(range: IReportRange) {
    const query =
      range.reportType === ReportType.AllTime
        ? `SELECT muzzledId, SUM(charactersSuppressed) as charactersSuppressed FROM muzzle GROUP BY muzzledId ORDER BY charactersSuppressed DESC;`
        : `SELECT muzzledId, SUM(charactersSuppressed) as charactersSuppressed FROM muzzle WHERE createdAt >= '${
            range.start
          }' AND createdAt < '${
            range.end
          }' GROUP BY muzzledId ORDER BY charactersSuppressed DESC;`;

    return getRepository(Muzzle).query(query);
  }

  private getMuzzlerByChars(range: IReportRange) {
    const query =
      range.reportType === ReportType.AllTime
        ? `SELECT requestorId, SUM(charactersSuppressed) as charactersSuppressed FROM muzzle GROUP BY requestorId ORDER BY charactersSuppressed DESC;`
        : `SELECT requestorId, SUM(charactersSuppressed) as charactersSuppressed FROM muzzle WHERE createdAt >= '${
            range.start
          }' AND createdAt < '${
            range.end
          }' GROUP BY requestorId ORDER BY charactersSuppressed DESC;`;

    return getRepository(Muzzle).query(query);
  }

  private getMostMuzzledByTime(range: IReportRange) {
    const query =
      range.reportType === ReportType.AllTime
        ? `SELECT muzzledId, SUM(milliseconds) as muzzleTime FROM muzzle GROUP BY muzzledId ORDER BY muzzleTime DESC;`
        : `SELECT muzzledId, SUM(milliseconds) as muzzleTime FROM muzzle WHERE createdAt >= '${
            range.start
          }' AND createdAt < '${
            range.end
          }' GROUP BY muzzledId ORDER BY muzzleTime DESC;`;

    return getRepository(Muzzle).query(query);
  }

  private getMuzzlerByTime(range: IReportRange) {
    const query =
      range.reportType === ReportType.AllTime
        ? `SELECT requestorId, SUM(milliseconds) as muzzleTime FROM muzzle GROUP BY requestorId ORDER BY muzzleTime DESC;`
        : `SELECT requestorId, SUM(milliseconds) as muzzleTime FROM muzzle WHERE createdAt >= '${
            range.start
          }' AND createdAt < '${
            range.end
          }' GROUP BY requestorId ORDER BY muzzleTime DESC;`;

    return getRepository(Muzzle).query(query);
  }

  private getAccuracy(range: IReportRange) {
    const query =
      range.reportType === ReportType.AllTime
        ? `SELECT requestorId, SUM(IF(messagesSuppressed > 0, 1, 0))/COUNT(*) as accuracy, SUM(IF(muzzle.messagesSuppressed > 0, 1, 0)) as kills, COUNT(*) as deaths
           FROM muzzle GROUP BY requestorId ORDER BY accuracy DESC;`
        : `SELECT requestorId, SUM(IF(messagesSuppressed > 0, 1, 0))/COUNT(*) as accuracy, SUM(IF(muzzle.messagesSuppressed > 0, 1, 0)) as kills, COUNT(*) as deaths FROM muzzle WHERE createdAt >= '${
            range.start
          }' AND createdAt < '${
            range.end
          }' GROUP BY requestorId ORDER BY accuracy DESC;`;

    return getRepository(Muzzle).query(query);
  }

  private getKdr(range: IReportRange) {
    const query =
      range.reportType === ReportType.AllTime
        ? `
        SELECT b.requestorId, IF(a.count > 0, a.count, 0) AS deaths, b.count as kills, b.count/IF(a.count > 0, a.count, 1) as kdr
        FROM (SELECT muzzledId, COUNT(*) as count FROM muzzle WHERE messagesSuppressed > 0 GROUP BY muzzledId) as a
        RIGHT JOIN (
        SELECT requestorId, COUNT(*) as count
        FROM muzzle
        WHERE messagesSuppressed > 0
        GROUP BY requestorId
        ) AS b
        ON a.muzzledId = b.requestorId
        GROUP BY b.requestorId, a.count, b.count, kdr
        ORDER BY kdr DESC;
        `
        : `
        SELECT b.requestorId, IF(a.count > 0, a.count, 0) AS deaths, b.count as kills, b.count/IF(a.count > 0, a.count, 1) as kdr
        FROM (SELECT muzzledId, COUNT(*) as count FROM muzzle WHERE messagesSuppressed > 0 AND createdAt >= '${
          range.start
        }' AND createdAt <= '${range.end}' GROUP BY muzzledId) as a
        RIGHT JOIN (
        SELECT requestorId, COUNT(*) as count
        FROM muzzle
        WHERE messagesSuppressed > 0 AND createdAt >= '${
          range.start
        }' AND createdAt <= '${range.end}'
        GROUP BY requestorId
        ) AS b
        ON a.muzzledId = b.requestorId
        GROUP BY b.requestorId, a.count, b.count, kdr
        ORDER BY kdr DESC;
        `;

    return getRepository(Muzzle).query(query);
  }

  private getNemesisByRaw(range: IReportRange) {
    const query =
      range.reportType === ReportType.AllTime
        ? `
    SELECT a.requestorId, a.muzzledId, MAX(a.count) as killCount
    FROM (
      SELECT requestorId, muzzledId, COUNT(*) as count
      FROM muzzle
      GROUP BY requestorId, muzzledId
    ) AS a 
    INNER JOIN(
      SELECT muzzledId, MAX(count) AS count
      FROM (
        SELECT requestorId, muzzledId, COUNT(*) AS count 
        FROM muzzle
        GROUP BY requestorId, muzzledId
      ) AS c 
      GROUP BY c.muzzledId
    ) AS b 
    ON a.muzzledId = b.muzzledId AND a.count = b.count
    GROUP BY a.requestorId, a.muzzledId
    ORDER BY a.count DESC;`
        : `
    SELECT a.requestorId, a.muzzledId, MAX(a.count) as killCount
    FROM (
      SELECT requestorId, muzzledId, COUNT(*) as count
      FROM muzzle
      WHERE createdAt >= '${range.start}' AND createdAt < '${range.end}'
      GROUP BY requestorId, muzzledId
    ) AS a 
    INNER JOIN(
      SELECT muzzledId, MAX(count) AS count
      FROM (
        SELECT requestorId, muzzledId, COUNT(*) AS count 
        FROM muzzle
        WHERE createdAt >= '${range.start}' AND createdAt < '${range.end}'
        GROUP BY requestorId, muzzledId
      ) AS c 
      GROUP BY c.muzzledId
    ) AS b 
    ON a.muzzledId = b.muzzledId AND a.count = b.count
    GROUP BY a.requestorId, a.muzzledId
    ORDER BY a.count DESC;`;

    return getRepository(Muzzle).query(query);
  }

  private getNemesisBySuccessful(range: IReportRange) {
    const query =
      range.reportType === ReportType.AllTime
        ? `
      SELECT a.requestorId, a.muzzledId, MAX(a.count) as killCount
      FROM (
        SELECT requestorId, muzzledId, COUNT(*) as count
        FROM muzzle
        WHERE messagesSuppressed > 0
        GROUP BY requestorId, muzzledId
      ) AS a 
      INNER JOIN(
        SELECT muzzledId, MAX(count) AS count
        FROM (
          SELECT requestorId, muzzledId, COUNT(*) AS count 
          FROM muzzle
          WHERE messagesSuppressed > 0
          GROUP BY requestorId, muzzledId
        ) AS c 
        GROUP BY c.muzzledId
      ) AS b 
      ON a.muzzledId = b.muzzledId AND a.count = b.count
      GROUP BY a.requestorId, a.muzzledId
      ORDER BY a.count DESC;`
        : `
      SELECT a.requestorId, a.muzzledId, MAX(a.count) as killCount
      FROM (
        SELECT requestorId, muzzledId, COUNT(*) as count
        FROM muzzle
        WHERE createdAt >= '${range.start}' AND createdAt < '${
            range.end
          }' AND messagesSuppressed > 0
        GROUP BY requestorId, muzzledId
      ) AS a 
      INNER JOIN(
        SELECT muzzledId, MAX(count) AS count
        FROM (
          SELECT requestorId, muzzledId, COUNT(*) AS count 
          FROM muzzle
          WHERE createdAt >= '${range.start}' AND createdAt < '${
            range.end
          }' AND messagesSuppressed > 0
          GROUP BY requestorId, muzzledId
        ) AS c 
        GROUP BY c.muzzledId
      ) AS b 
      ON a.muzzledId = b.muzzledId AND a.count = b.count
      GROUP BY a.requestorId, a.muzzledId
      ORDER BY a.count DESC;`;

    return getRepository(Muzzle).query(query);
  }
}
