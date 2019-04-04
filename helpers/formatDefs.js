const capitalizeFirstLetter = require("./capitalizeFirstLetter");

function formatDefs(defArr) {
  if (!defArr || defArr.length === 0) {
    return [{ text: "Sorry no definitions found" }];
  }
  const formattedArr = [];
  const maxDefinitions = 3;
  for (let i = 0; i < maxDefinitions; i++) {
    formattedArr.push({
      text: formatUrbanD(
        `${i + 1}. ${capitalizeFirstLetter(defArr[i].definition)}`
      )
    });
  }
  return formattedArr;
}

function formatUrbanD(definition) {
  return definition.replace(/\[/g, "*").replace(/]/g, "*");
}
module.exports = formatDefs;
