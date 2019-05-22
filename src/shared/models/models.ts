export interface IUrbanDictionaryResponse {
  list: IUrbanDictionaryDefinition[];
}

export interface ISlackChannelResponse {
  response_type: string;
  text: string;
  attachments: IFormattedUrbanDictionaryDefinitionResponse[];
}

// Horrible name.
export interface IFormattedUrbanDictionaryDefinitionResponse {
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
