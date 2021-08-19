import moment from 'moment';
import Sentiment, { AnalysisResult } from 'sentiment';
import { getRepository, InsertResult } from 'typeorm';
import { Sentiment as SentimentDB } from '../../shared/db/models/Sentiment';
import { SuppressorService } from '../../shared/services/suppressor.service';

export class SentimentService extends SuppressorService {
  sentiment = new Sentiment();

  public async performSentimentAnalysis(userId: string, teamId: string, text: string): void {
    this.analyzeSentimentAndStore(userId, teamId, text).then(() => {
      this.autoMuzzleIfNecessary(userId, teamId, text);
    });
  }

  public async analyzeSentimentAndStore(userId: string, teamId: string, text: string): Promise<InsertResult> {
    const emotionalScore: AnalysisResult = this.sentiment.analyze(text);
    console.log('user', userId);
    console.log('team', teamId);
    console.log('text', text);
    const sentimentModel = new SentimentDB();
    sentimentModel.sentiment = emotionalScore.comparative;
    sentimentModel.teamId = teamId;
    sentimentModel.userId = userId;
    return getRepository(SentimentDB).insert(sentimentModel);
  }

  getAvgSentimentForTimePeriod(userId: string, teamId: string, start: string, end: string): Promise<any> {
    const query = `SELECT AVG(sentiment) FROM sentiment WHERE userId='${userId}' AND teamId='${teamId}' AND createdAt >= '${start}' AND createdAt < '${end}';`;
    return getRepository(SentimentDB)
      .query(query)
      .then(result => {
        console.log(result);
        return result;
      });
  }

  public async autoMuzzleIfNecessary(userId: string, teamId: string, text: string) {
    const start = moment()
      .subtract(3, 'minutes')
      .format('YYYY-MM-DD HH:mm:ss');
    const end = moment().format('YYYY-MM-DD HH:mm:ss');
    const isSuppressed = await this.isSuppressed(userId, teamId);
    if (!isSuppressed) {
      const averageSentiment = await this.getAvgSentimentForTimePeriod(userId, teamId, start, end);
      if (averageSentiment < 0) {
        console.log(`${userId} should be muzzled because his sentiment analysis score was: ${averageSentiment}`);
      } else {
        this.analyzeSentimentAndStore(userId, teamId, text);
      }
    }
  }
}
