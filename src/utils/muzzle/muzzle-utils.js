// Store for the muzzled users.
const muzzled = [];

/**
 * Takes in text and randomly muzzles certain words.
 *
 * @param {string} text
 * @returns
 */
function muzzle(text) {
  let returnText = "";
  const words = text.split(" ");
  for (let i = 0; i < words.length; i++) {
    returnText += this.isRandomEven() ? ` *${words[i]}* ` : " ..mMm.. ";
  }
  return returnText;
}

/**
 * Adds a user to the muzzled array and sets a timeout to remove the muzzle within a random time of 30 seconds to 3 minutes
 *
 * @param {*} toMuzzle
 * @param {*} friendlyMuzzle
 * @param {*} requestor
 * @returns
 */
function addUserToMuzzled(toMuzzle, friendlyMuzzle, requestor) {
  const timeToMuzzle = Math.floor(Math.random() * (180000 - 30000 + 1) + 30000);
  const minutes = Math.floor(timeToMuzzle / 60000);
  const seconds = ((timeToMuzzle % 60000) / 1000).toFixed(0);
  if (muzzled.includes(toMuzzle)) {
    console.error(
      `${requestor} attempted to muzzle ${toMuzzle} but ${toMuzzle} is already muzzled.`
    );
    throw new Error(`${friendlyMuzzle} is already muzzled!`);
  } else if (muzzled.includes(requestor)) {
    console.error(
      `User: ${requestor} attempted to muzzle ${toMuzzle} but failed because requestor: ${requestor} is currently muzzled`
    );
    throw new Error(`You can't muzzle someone if you are already muzzled!`);
  } else {
    muzzled.push(toMuzzle);
    console.log(
      `${friendlyMuzzle} is now muzzled for ${timeToMuzzle} milliseconds`
    );
    setTimeout(() => removeMuzzle(toMuzzle), timeToMuzzle);
    return `Succesfully muzzled ${friendlyMuzzle} for ${
      seconds == 60
        ? minutes + 1 + "m00s"
        : minutes + "m" + (seconds < 10 ? "0" : "") + seconds + "s"
    } minutes`;
  }
}

function removeMuzzle(user) {
  console.log(`Attempting to remove ${user}'s muzzle...`);
  muzzled.splice(muzzled.indexOf(user), 1);
  console.log(`Removed ${user}'s muzzle! He is free at last.`);
}

function isRandomEven() {
  return Math.floor(Math.random() * 2) % 2 === 0;
}

exports.muzzle = muzzle;
exports.isRandomEven = isRandomEven;