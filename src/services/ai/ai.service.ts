import { Configuration, OpenAIApi } from 'openai';
import { AIPersistenceService } from './ai.persistence';

const MAX_AI_REQUESTS_PER_DAY = 7;

export class AIService {
  private redis = AIPersistenceService.getInstance();
  private openai = new OpenAIApi(
    new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    }),
  );

  public isAlreadyInflight(userId: string, teamId: string): Promise<boolean> {
    return this.redis.getInflight(userId, teamId).then(x => !!x);
  }

  public isAlreadyAtMaxRequests(userId: string, teamId: string): Promise<boolean> {
    return this.redis.getDailyRequests(userId, teamId).then(x => Number(x) >= MAX_AI_REQUESTS_PER_DAY);
  }

  public async generateText(userId: string, teamId: string, text: string): Promise<string | undefined> {
    await this.redis.setInflight(userId, teamId);
    await this.redis.setDailyRequests(userId, teamId);

    return this.openai
      .createCompletion({
        model: 'text-davinci-003',
        prompt: text,
        // eslint-disable-next-line @typescript-eslint/camelcase
        max_tokens: 1000,
      })
      .then(x => {
        console.log(x.data);
        return x.data.choices[0].text?.trim();
      })
      .catch(async e => {
        await this.redis.decrementDailyRequests(userId, teamId);
        throw e;
      })
      .finally(() => this.redis.removeInflight(userId, teamId));
  }

  public async generateImage(userId: string, teamId: string, text: string): Promise<string | undefined> {
    await this.redis.setInflight(userId, teamId);
    await this.redis.setDailyRequests(userId, teamId);
    return this.openai
      .createImage({
        prompt: text,
        n: 1,
        size: '256x256',
      })
      .then(x => {
        console.log(x.data.data);
        return x.data.data[0]?.url;
      })
      .catch(async e => {
        await this.redis.decrementDailyRequests(userId, teamId);
        throw e;
      })
      .finally(async () => await this.redis.removeInflight(userId, teamId));
  }
}
