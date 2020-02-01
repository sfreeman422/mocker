import express, { Request, Response, Router } from "express";
import { BackFirePersistenceService } from "../services/backfire/backfire.persistence.service";
import { CounterPersistenceService } from "../services/counter/counter.persistence.service";
import { MuzzlePersistenceService } from "../services/muzzle/muzzle.persistence.service";
import { MuzzleService } from "../services/muzzle/muzzle.service";
import { ReportService } from "../services/report/report.service";
import { SlackService } from "../services/slack/slack.service";
import { WebService } from "../services/web/web.service";
import { ReportType } from "../shared/models/muzzle/muzzle-models";
import { ISlashCommandRequest } from "../shared/models/slack/slack-models";

export const muzzleController: Router = express.Router();

const muzzleService = new MuzzleService();
const slackService = SlackService.getInstance();
const webService = WebService.getInstance();
const muzzlePersistenceService = MuzzlePersistenceService.getInstance();
const backfirePersistenceService = BackFirePersistenceService.getInstance();
const counterPersistenceService = CounterPersistenceService.getInstance();
const reportService = new ReportService();

muzzleController.post("/muzzle", async (req: Request, res: Response) => {
  const request: ISlashCommandRequest = req.body;
  const userId: any = slackService.getUserId(request.text);
  const results = await muzzleService
    .addUserToMuzzled(userId, request.user_id, request.channel_name)
    .catch(e => {
      res.send(e);
    });
  if (results) {
    res.send(results);
  }
});

muzzleController.post("/muzzle/stats", async (req: Request, res: Response) => {
  const request: ISlashCommandRequest = req.body;
  const userId: string = request.user_id;
  if (
    muzzlePersistenceService.isUserMuzzled(userId) ||
    backfirePersistenceService.isBackfire(request.user_id) ||
    counterPersistenceService.isCounterMuzzled(request.user_id)
  ) {
    res.send(`Sorry! Can't do that while muzzled.`);
  } else if (request.text.split(" ").length > 1) {
    res.send(
      `Sorry! No support for multiple parameters at this time. Please choose one of: \`week\`, \`month\`, \`trailing30\`, \`year\`, \`all\``
    );
  } else if (
    request.text !== "" &&
    !reportService.isValidReportType(request.text)
  ) {
    res.send(
      `Sorry! You passed in \`${
        request.text
      }\` but we can only generate reports for the following values: \`week\`, \`month\`, \`trailing30\`, \`year\`, \`all\``
    );
  } else {
    const reportType: ReportType = reportService.getReportType(request.text);
    const report = await reportService.getMuzzleReport(reportType);
    webService.uploadFile(
      req.body.channel_id,
      report,
      reportService.getReportTitle(reportType)
    );
    res.status(200).send();
  }
});
