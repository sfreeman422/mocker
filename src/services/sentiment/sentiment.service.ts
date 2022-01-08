import Sentiment, { AnalysisOptions, AnalysisResult } from 'sentiment';
import { getRepository, InsertResult } from 'typeorm';
import { Sentiment as SentimentDB } from '../../shared/db/models/Sentiment';

export class SentimentService {
  sentiment = new Sentiment();

  public performSentimentAnalysis(userId: string, teamId: string, channelId: string, text: string): void {
    this.analyzeSentimentAndStore(userId, teamId, channelId, text);
  }

  public async analyzeSentimentAndStore(
    userId: string,
    teamId: string,
    channelId: string,
    text: string,
  ): Promise<InsertResult> {
    const options: AnalysisOptions = {
      extras: {
        wtf: 0,
        WTF: 0,
      },
    };
    const emotionalScore: AnalysisResult = this.sentiment.analyze(text, options);
    const sentimentModel = new SentimentDB();
    sentimentModel.sentiment = emotionalScore.comparative;
    sentimentModel.teamId = teamId;
    sentimentModel.userId = userId;
    sentimentModel.channelId = channelId;
    return getRepository(SentimentDB).insert(sentimentModel);
  }

  getAvgSentimentForTimePeriod(userId: string, teamId: string, start: string, end: string): Promise<any> {
    const query = `select AVG(sentiment.sentiment) as avg, COUNT(sentiment.userId) as count, sentiment.userId, slack_user.isBot FROM sentiment INNER JOIN slack_user ON slack_user.slackId = sentiment.userId WHERE slack_user.isBot != 1 AND sentiment.userId = '${userId}' AND sentiment.teamId = '${teamId}' AND sentiment.createdAt >= '${start}' AND sentiment.createdAt < '${end}' GROUP BY sentiment.userId, slack_user.isBot;`;
    return getRepository(SentimentDB)
      .query(query)
      .then(result => result);
  }

  getAvgAndSTD(teamId: string): Promise<any> {
    const query = `SELECT AVG(sentiment) as avg, STD(sentiment) as std from sentiment WHERE teamId='${teamId}';`;
    return getRepository(SentimentDB)
      .query(query)
      .then(result => result);
  }
}
