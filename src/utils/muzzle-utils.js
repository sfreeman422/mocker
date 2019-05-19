module.exports = {
  muzzle(text) {
    let returnText = "";
    const words = text.split(" ");
    for (let i = 0; i < words.length; i++) {
      returnText += this.isRandomEven() ? ` *${words[i]}* ` : " ..mMm.. ";
    }
    return returnText;
  },
  isRandomEven() {
    return Math.floor(Math.random() * 2) % 2 === 0;
  }
};
