const capitalizeFirstLetter = require("./capitalizeFirstLetter");

function formatDefs(defArr) {
  if (!defArr) {
    return [{ text: "Sorry no definitions found" }];
  }
  const formattedArr = [];
  const maxDefinitions = 3;
  for (let i = 0; i < maxDefinitions; i++) {
    formattedArr.push({
      text: `${i + 1}. ${capitalizeFirstLetter(defArr[i].definition)}`
    });
  }
  return formattedArr;
}

module.exports = formatDefs;
