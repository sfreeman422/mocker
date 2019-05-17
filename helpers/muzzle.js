function muzzle(text) {
  let returnText = "";
  const words = text.split(" ");
  for (let i = 0; i < words.length; i++) {
    returnText += isRandomEven() ? ` *${words[i]}* ` : " ..mMm.. ";
  }
  return returnText;
}

function isRandomEven() {
  return Math.floor(Math.random() * 2) % 2 === 0;
}

module.exports = muzzle;