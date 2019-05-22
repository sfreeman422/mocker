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
  text: string;
  user_id: string;
  response_url: string;
}

export interface IEventRequest {
  challenge: string;
  user_name: string;
  event: IEvent;
}

export interface IEvent {
  user: string;
  channel: string;
  ts: string;
  text: string;
}

export interface IAttachment {
  text: string;
}
