import bodyParser from "body-parser";
import express, { Application } from "express";
import { defineRoutes } from "./routes/define-route";
import { mockRoutes } from "./routes/mock-route";
import { muzzleRoutes } from "./routes/muzzle-route";
import { connectToDb } from "./shared/db/utils/database";

const app: Application = express();
const PORT: number = 3000;

connectToDb();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(mockRoutes);
app.use(muzzleRoutes);
app.use(defineRoutes);

app.listen(PORT, (e: Error) =>
  e ? console.error(e) : console.log("Listening on port 3000")
);
