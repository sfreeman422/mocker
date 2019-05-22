export interface IUrbanDictionaryResponse {
  list: IUrbanDictionaryDefinition[];
}

export interface ISlackChannelResponse {
  response_type: string;
  text: string;
  attachments: IFormattedDefinition[];
}

export interface IFormattedDefinition {
  text: string;
}

export interface IUrbanDictionaryDefinition {
  definition: string;
  permalink: string;
  thumbs_up: number;
  author: string;
  word: string;
  defid: number;
  written_on: string; // ISO Date
  example: string;
  thumbs_down: number;
  current_vote?: string;
  sound_urls?: any[];
}

export interface ISlackDeleteMessageRequest {
  token: string;
  channel: string;
  ts: string;
  as_user: boolean;
}

export interface ISlackPostMessageRequest {
  token: string;
  channel: string;
  text: string;
}

export interface ISlashCommandRequest {
  text: string;
  user_id: string;
  response_url: string;
}

export interface ISlackEventRequest {
  challenge: string;
  event: ISlackEvent;
}

export interface ISlackEvent {
  user: string;
  channel: string;
  ts: string;
  text: string;
}
