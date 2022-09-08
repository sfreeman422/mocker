import Table from 'easy-table';
import { getRepository } from 'typeorm';
import { ReportService } from '../../shared/services/report.service';
import { Rep } from '../../shared/db/models/Rep';
import { ReactionByUser } from '../../shared/models/reaction/ReactionByUser.model';
import { Reaction } from '../../shared/db/models/Reaction';

export class ReactionReportService extends ReportService {
  public async getRep(userId: string, teamId: string): Promise<string> {
    const spendingRep = await this.getTotalRep(userId, teamId).catch(() => {
      throw new Error(`Unable to retrieve your rep due to an error!`);
    });

    const message = spendingRep
      ? `\n*You currently have _${spendingRep.rep}_ rep.*`
      : `You do not currently have any rep.`;

    const repByUser = await this.getRepByUser(userId, teamId)
      .then(async (perUserRep: ReactionByUser[] | undefined) => {
        const total = perUserRep?.reduce((totalRep, currVal) => Number(totalRep) + Number(currVal.rep), 0) || 0;
        console.log(total);
        return await this.formatRepByUser(perUserRep, teamId, total);
      })
      .catch(e => console.error(e));

    return `${repByUser}\n\n${message}`;
  }

  public getTotalRep(userId: string, teamId: string): Promise<Rep | undefined> {
    return new Promise(async (resolve, reject) => {
      await getRepository(Rep)
        .findOne({ user: userId, teamId })
        .then(async value => {
          await getRepository(Rep)
            .increment({ user: userId, teamId }, 'timesChecked', 1)
            .catch(e => console.error(`Error logging check for user ${userId}. \n ${e}`));
          resolve(value);
        })
        .catch(e => reject(e));
    });
  }

  public getRepByUser(userId: string, teamId: string): Promise<ReactionByUser[] | undefined> {
    return new Promise(async (resolve, reject) => {
      await getRepository(Reaction)
        .query(
          `SELECT reactingUser, SUM(value) as rep FROM reaction WHERE affectedUser=? AND teamId=? GROUP BY reactingUser ORDER BY rep DESC;`,
          [userId, teamId],
        )
        .then(value => resolve(value))
        .catch(e => reject(e));
    });
  }

  public getRepByChannel(teamId: string): Promise<any[] | undefined> {
    return getRepository(Reaction)
      .query(
        `SELECT AVG(value) as avg, channel WHERE teamId=${teamId} FROM reaction GROUP BY channel ORDER BY avg DESC;`,
      )
      .then(result => {
        const formatted = result.map((avgReaction: any) => {
          return {
            value: avgReaction.avg,
            channel: this.slackService.getChannelName(avgReaction.channel, teamId),
          };
        });
        return formatted;
      });
  }

  private async formatRepByUser(
    perUserRep: ReactionByUser[] | undefined,
    teamId: string,
    totalRep: number,
  ): Promise<string> {
    if (!perUserRep) {
      return 'You do not have any existing relationships.';
    } else {
      const formattedData = await Promise.all(
        perUserRep.map(async userRep => {
          return {
            user: await this.slackService.getUserNameById(userRep.reactingUser, teamId),
            rep: `${this.getSentiment(userRep.rep, totalRep)} (${((userRep.rep / totalRep) * 100).toPrecision(3)}%)`,
          };
        }),
      );
      return `${Table.print(formattedData)}`;
    }
  }

  private getSentiment(rep: number, totalRep: number): string {
    const percent = rep / totalRep;
    if (percent >= 0.9) {
      return 'Worshipped';
    } else if (percent >= 0.8 && percent < 0.9) {
      return 'Enamored';
    } else if (percent >= 0.7 && percent < 0.8) {
      return 'Adored';
    } else if (percent >= 0.6 && percent < 0.7) {
      return 'Loved';
    } else if (percent >= 0.5 && percent < 0.6) {
      return 'Endeared';
    } else if (percent >= 0.4 && percent < 0.5) {
      return 'Admired';
    } else if (percent >= 0.3 && percent < 0.4) {
      return 'Esteemed';
    } else if (percent >= 0.2 && percent < 0.3) {
      return 'Well Liked';
    } else if (percent >= 0.1 && percent < 0.2) {
      return 'Liked';
    } else if (percent >= 0.01 && percent < 0.1) {
      return 'Respected';
    }
    return 'Neutral';
  }
}
