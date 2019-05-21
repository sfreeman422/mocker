import Axios, { AxiosResponse } from "axios";
import {
  UrbanDictionaryResponse,
  UrbanDictionaryDefinition,
  FormattedUrbanDictionaryDefinitionResponse
} from "../../shared/models/models";

/**
 * Capitalizes the first letter of a given sentence.
 */
export function capitalizeFirstLetter(sentence: string): string {
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}`;
}

/**
 * Returns a promise to look up a definition on urban dictionary.
 */
export function define(word: string): Promise<UrbanDictionaryResponse> {
  return Axios.get(`http://api.urbandictionary.com/v0/define?term=${word}`)
    .then((res: AxiosResponse<UrbanDictionaryResponse>) => {
      return res.data;
    })
    .catch(e => {
      console.log("error", e);
      return e;
    });
}

/**
 * Takes in an array of definitions and breaks them down into a shortened list depending on maxDefs
 */
export function formatDefs(defArr: UrbanDictionaryDefinition[], maxDefs = 3) {
  if (!defArr || defArr.length === 0) {
    return [{ text: "Sorry, no definitions found." }];
  }

  const formattedArr: FormattedUrbanDictionaryDefinitionResponse[] = [];
  const maxDefinitions: number =
    defArr.length <= maxDefs ? defArr.length : maxDefs;

  for (let i = 0; i < maxDefinitions; i++) {
    formattedArr.push({
      text: formatUrbanD(
        `${i + 1}. ${capitalizeFirstLetter(defArr[i].definition)}`
      )
    });
  }
  return formattedArr;
}

/**
 * Takes in a definition and removes brackets.
 */
export function formatUrbanD(definition: string): string {
  let formattedDefinition: string = "";
  for (let i = 0; i < definition.length; i++) {
    if (definition[i] !== "[" || definition[i] !== "]") {
      formattedDefinition += definition[i];
    }
  }
  return formattedDefinition;
}
