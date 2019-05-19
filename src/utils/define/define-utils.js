const Axios = require("axios");

/**
 * Capitalizes the first letter of a string.
 *
 * @param {string} string
 * @returns
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Returns a promise to look up a definition on urban dictionary.
 *
 * @param {*} word
 * @returns
 */
function define(word) {
  const response = Axios.get(
    `http://api.urbandictionary.com/v0/define?term=${word}`
  )
    .then(res => {
      return res.data;
    })
    .catch(e => {
      console.log("error", e);
      return e;
    });
  return response;
}

/**
 * Takes in an array of definitions and breaks them down into a shortened list depending on maxDefs
 *
 * @param {*} defArr - Array of definitions
 * @param {*} maxDefs - Maximum number of definitions to send.
 * @returns
 */
function formatDefs(defArr, maxDefs = 3) {
  if (!defArr || defArr.length === 0) {
    return [{ text: "Sorry, no definitions found." }];
  }
  const formattedArr = [];
  const maxDefinitions = defArr.length <= maxDefs ? defArr.length : maxDefs;
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
 * Takes in a definition and reformats it to replace brackets with *
 *
 * @param {*} definition
 * @returns
 */
function formatUrbanD(definition) {
  return definition.replace(/\[/g, "*").replace(/]/g, "*");
}

exports.capitalizeFirstLetter = capitalizeFirstLetter;
exports.define = define;
exports.formatDefs = formatDefs;
exports.formatUrbanD = formatUrbanD;
