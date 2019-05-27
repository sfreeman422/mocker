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

export interface IAttachment {
  text: string;
}
