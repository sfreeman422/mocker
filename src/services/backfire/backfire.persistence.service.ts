import { UpdateResult, getRepository } from 'typeorm';
import { Backfire } from '../../shared/db/models/Backfire';
import { RedisPersistenceService } from '../../shared/services/redis.persistence.service';

export class BackFirePersistenceService {
  public static getInstance(): BackFirePersistenceService {
    if (!BackFirePersistenceService.instance) {
      BackFirePersistenceService.instance = new BackFirePersistenceService();
    }
    return BackFirePersistenceService.instance;
  }

  private static instance: BackFirePersistenceService;
  private redis: RedisPersistenceService = RedisPersistenceService.getInstance();

  public addBackfire(userId: string, time: number, teamId: string): Promise<void> {
    const backfire = new Backfire();
    backfire.muzzledId = userId;
    backfire.messagesSuppressed = 0;
    backfire.wordsSuppressed = 0;
    backfire.charactersSuppressed = 0;
    backfire.milliseconds = time;
    backfire.teamId = teamId;

    return getRepository(Backfire)
      .save(backfire)
      .then(backfireFromDb => {
        this.redis.setValueWithExpire(
          this.getRedisKeyName(userId, teamId),
          backfireFromDb.id,
          'EX',
          Math.floor(time / 1000),
        );
        this.redis.setValueWithExpire(this.getRedisKeyName(userId, teamId, true), 0, 'EX', Math.floor(time / 1000));
      });
  }

  public async removeBackfire(userId: string, teamId: string): Promise<void> {
    await this.redis.removeKey(this.getRedisKeyName(userId, teamId));
  }

  public async isBackfire(userId: string, teamId: string): Promise<boolean> {
    const hasBackfire = await this.redis.getValue(this.getRedisKeyName(userId, teamId));
    return !!hasBackfire;
  }

  public getSuppressions(userId: string, teamId: string): Promise<string | null> {
    return this.redis.getValue(this.getRedisKeyName(userId, teamId, true));
  }

  public async addSuppression(userId: string, teamId: string): Promise<void> {
    const suppressions = await this.getSuppressions(userId, teamId);
    const number = suppressions ? +suppressions : 0;
    this.redis.setValue(this.getRedisKeyName(userId, teamId, true), number + 1);
  }

  public async addBackfireTime(userId: string, teamId: string, timeToAdd: number): Promise<void> {
    const hasBackfire = await this.isBackfire(userId, teamId);
    if (hasBackfire) {
      const timeRemaining = await this.redis.getTimeRemaining(this.getRedisKeyName(userId, teamId));
      const newTime = Math.floor(timeRemaining + timeToAdd / 1000);
      await this.redis.expire(this.getRedisKeyName(userId, teamId), newTime);
      await this.redis.expire(this.getRedisKeyName(userId, teamId, true), newTime);
      const backfireId = await this.redis.getValue(this.getRedisKeyName(userId, teamId));
      if (backfireId) {
        this.incrementBackfireTime(+backfireId, timeToAdd);
      }
      console.log(`Setting ${userId}'s backfire time to ${newTime}`);
    }
  }

  public getBackfireByUserId(userId: string, teamId: string): Promise<string | null> {
    return this.redis.getValue(this.getRedisKeyName(userId, teamId));
  }

  /**
   * Determines suppression counts for messages that are ONLY deleted.
   * Used when a backfired user has hit their max suppressions or when they have tagged channel.
   */
  public trackDeletedMessage(backfireId: number, text: string): void {
    const words = text.split(' ').length;
    const characters = text.split('').length;
    this.incrementMessageSuppressions(backfireId);
    this.incrementWordSuppressions(backfireId, words);
    this.incrementCharacterSuppressions(backfireId, characters);
  }

  public incrementBackfireTime(id: number, ms: number): Promise<UpdateResult> {
    return getRepository(Backfire).increment({ id }, 'milliseconds', ms);
  }

  public incrementMessageSuppressions(id: number): Promise<UpdateResult> {
    return getRepository(Backfire).increment({ id }, 'messagesSuppressed', 1);
  }

  public incrementWordSuppressions(id: number, suppressions: number): Promise<UpdateResult> {
    return getRepository(Backfire).increment({ id }, 'wordsSuppressed', suppressions);
  }

  public incrementCharacterSuppressions(id: number, charactersSuppressed: number): Promise<UpdateResult> {
    return getRepository(Backfire).increment({ id }, 'charactersSuppressed', charactersSuppressed);
  }

  private getRedisKeyName(userId: string, teamId: string, isSuppression = false) {
    return `backfire.${userId}-${teamId}${isSuppression ? '.suppressions' : ''}`;
  }
}