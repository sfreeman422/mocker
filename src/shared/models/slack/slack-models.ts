export interface IChannelResponse {
  response_type: string;
  text: string;
  attachments: IAttachment[];
}

export interface IDeleteMessageRequest {
  token: string;
  channel: string;
  ts: string;
  as_user: boolean;
}

export interface IPostMessageRequest {
  token: string;
  channel: string;
  text: string;
}

export interface ISlashCommandRequest {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
}

export interface IEventRequest {
  challenge: string;
  token: string;
  team_id: string;
  api_app_id: string;
  event: IEvent;
  type: string;
  event_id: string;
  event_time: number;
  authed_users: string[];
}

export interface IEvent {
  client_msg_id: string;
  type: string; // Is there more specific types?
  text: string;
  user: string;
  ts: string;
  channel: string;
  event_ts: string;
  channel_type: string;
  subtype?: string; // message_deleted
  hidden?: boolean;
  deleted_ts?: string;
}

export interface IUser {
  ok: boolean;
  profile: IUserProfile;
  response_metadata: IResponseMetaData;
}

export interface IUserProfile {
  title: string;
  phone: string;
  skype: string;
  real_name: string;
  real_name_normalized: string;
  display_name: string;
  display_name_normalized: string;
  fields: any[];
  status_text: string;
  status_emoji: string;
  status_expiration: number;
  avatar_hash: string;
  email: string;
  first_name: string;
  last_name: string;
  image_original: string;
  image_24: string;
  image_32: string;
  image_48: string;
  image_72: string;
  image_192: string;
  image_512: string;
  image_1024: string;
  status_text_canonical: string;
}

export interface IResponseMetaData {
  scopes: string[];
  acceptedScopes: string[];
}

export interface IAttachment {
  text: string;
}
