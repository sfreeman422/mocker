const capitalizeFirstLetter = require("./capitalizeFirstLetter");

function formatDefs(defArr) {
  const formattedArr = [];
  for (let i = 0; i < defArr.length; i++) {
    formattedArr.push({
      text: capitalizeFirstLetter(defArr[i])
    });
  }
  return formattedArr;
}

module.exports = formatDefs;
