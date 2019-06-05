import { Sequelize } from "sequelize";
import { getUserList } from "../models/User/User";
export const db = new Sequelize("mysql://root@localhost:3306/mocker"); // TODO: Get correct TS Type.
export let slackUsers = {};

// TO DO: This should all use TypeORM instead. It has better TS support and doesnt suck as much
export async function connectToDb() {
  await db
    .authenticate()
    .then(() => {
      console.log("Connected to mocker db!");
    })
    .catch((err: Error) => {
      console.error("Unable to connect to the database: mocker", err);
    });
  slackUsers = getUserList();
  console.log(slackUsers);
}

export function addMessageToDb() {
  // adds a message to the db;
}

export function removeMessageFromDb() {
  // removes a message from the db.
}

export function editMessageInDb() {
  // edits a message in the db.
}
