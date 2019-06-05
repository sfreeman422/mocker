import * as Sequelize from "sequelize";
import { IUser } from "../../../models/slack/slack-models";
import { db } from "../../utils/database";

const allowNullString = {
  type: Sequelize.STRING,
  allowNull: true
};

const requiredString = {
  type: Sequelize.STRING,
  allowNull: false
};

const allowNullArray = {
  type: Sequelize.ARRAY,
  allowNull: true
};

const allowNullNumber = {
  type: Sequelize.NUMBER,
  allowNull: true
};

const seqUserDef = {
  slackId: requiredString,
  display_name: requiredString,
  display_name_normalized: requiredString,
  title: allowNullString,
  phone: allowNullString,
  skype: allowNullString,
  real_name: allowNullString,
  real_name_normalized: allowNullString,
  fields: allowNullArray,
  status_text: allowNullString,
  status_emoji: allowNullString,
  status_expiration: allowNullNumber,
  avatar_hash: allowNullString,
  email: allowNullString,
  first_name: allowNullString,
  last_name: allowNullString,
  image_original: allowNullString,
  image_24: allowNullString,
  image_32: allowNullString,
  image_48: allowNullString,
  image_72: allowNullString,
  image_192: allowNullString,
  image_512: allowNullString,
  image_1024: allowNullString,
  status_text_canonical: allowNullString
};

export const User = db.define("user", seqUserDef);

export async function getUserList() {
  return User.findAll().then((users: IUser) => users);
}

export async function addUserToDb(userObj: IUser) {
  return User.sync().then(() => User.create(userObj));
}
