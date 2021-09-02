import moment from 'moment';
import Sentiment, { AnalysisOptions, AnalysisResult } from 'sentiment';
import { getRepository, InsertResult } from 'typeorm';
import { Sentiment as SentimentDB } from '../../shared/db/models/Sentiment';
import { MuzzleService } from '../muzzle/muzzle.service';
import { SlackService } from '../slack/slack.service';
import { WebService } from '../web/web.service';

export class SentimentService {
  sentiment = new Sentiment();
  private webService = WebService.getInstance();
  private slackService = SlackService.getInstance();
  private muzzleService = new MuzzleService();

  public performSentimentAnalysis(userId: string, teamId: string, text: string): void {
    this.analyzeSentimentAndStore(userId, teamId, text).then(() => {
      this.autoMuzzleIfNecessary(userId, teamId);
    });
  }

  public async analyzeSentimentAndStore(userId: string, teamId: string, text: string): Promise<InsertResult> {
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

  public async autoMuzzleIfNecessary(userId: string, teamId: string): Promise<void> {
    const start = moment()
      .subtract(5, 'minutes')
      .format('YYYY-MM-DD HH:mm:ss');
    const end = moment().format('YYYY-MM-DD HH:mm:ss');
    const averageSentiment = await this.getAvgSentimentForTimePeriod(userId, teamId, start, end);
    const avgAndStd = await this.getAvgAndSTD(teamId);
    const avgMinusOneStd = avgAndStd?.[0]?.avg - avgAndStd?.[0]?.std;
    console.log(averageSentiment);
    console.log('user avg', averageSentiment?.[0]?.avg);
    console.log('team std', avgAndStd?.[0]?.std);
    console.log('team avg', avgAndStd?.[0]?.avg);
    console.log('team avg minus std', avgMinusOneStd);
    if (averageSentiment?.[0]?.avg <= avgMinusOneStd && averageSentiment?.[0]?.count >= 5) {
      console.log(`${userId} should be muzzled.`);
      this.slackService.getUserById(userId, teamId).then(user => {
        this.webService.sendDebugMessage(
          'U2YJQN2KB',
          `${user?.name} should be muzzled. 
          User Average was ${averageSentiment?.[0]?.avg}.
          Team Average was ${avgAndStd?.[0]?.avg}.
          Team STD was ${avgAndStd?.[0]?.std}.
          Team Average Minus STD was ${avgMinusOneStd}.
          `,
        );
        this.muzzleService.autoMuzzle(userId, teamId);
      });
    }
  }
}
