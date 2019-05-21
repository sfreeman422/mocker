export interface UrbanDictionaryResponse {
  list: UrbanDictionaryDefinition[];
}

export interface DefinitionResponse {
  response_type: string;
  text: string;
  attachments: FormattedUrbanDictionaryDefinitionResponse[];
}

// Horrible name.
export interface FormattedUrbanDictionaryDefinitionResponse {
  text: string;
}

export interface UrbanDictionaryDefinition {
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
