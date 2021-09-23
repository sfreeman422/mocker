import Table from 'easy-table';
import { ReportService } from '../../shared/services/report.service';
import { List } from '../../shared/db/models/List';
import { getManager, getRepository } from 'typeorm';
import { ListUser } from './ListUser.model';

export class ListReportService extends ReportService {
  // TODO: Add Team ID to the query.
  public async getListReport(): Promise<string> {
    const query = `SELECT u.name, l.text FROM list AS l INNER JOIN slack_user AS u ON u.slackId=l.requestorId;    `;
    await getManager().query(query);
    const listReport = await getRepository(List).find();
    return this.formatListReport(listReport);
  }

  private formatListReport(report: any): string {
    const reportWithoutDate = report.map((listItem: ListUser) => {
      return { Item: `${listItem.text} - ${listItem.name}` };
    });

    return `
The List
    
${Table.print(reportWithoutDate)}
`;
  }
}
