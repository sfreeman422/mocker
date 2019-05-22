// Store for the muzzled users.
const muzzled: string[] = [];

/**
 * Takes in text and randomly muzzles certain words.
 */
export function muzzle(text: string) {
  let returnText = "";
  const words = text.split(" ");
  for (const word of words) {
    returnText += isRandomEven() ? ` *${word}* ` : " ..mMm.. ";
  }
  return returnText;
}

/**
 * Tells whether or not a user has been added to the muzzled arary
 */
export function isMuzzled(user: string) {
  return muzzled.includes(user);
}

/**
 * Adds a user to the muzzled array and sets a timeout to remove the muzzle within a random time of 30 seconds to 3 minutes
 */
export function addUserToMuzzled(
  toMuzzle: string,
  friendlyMuzzle: string,
  requestor: string
) {
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
      +seconds === 60
        ? minutes + 1 + "m00s"
        : minutes + "m" + (+seconds < 10 ? "0" : "") + seconds + "s"
    } minutes`;
  }
}

export function removeMuzzle(user: string) {
  muzzled.splice(muzzled.indexOf(user), 1);
  console.log(`Removed ${user}'s muzzle! He is free at last.`);
}

export function isRandomEven() {
  return Math.floor(Math.random() * 2) % 2 === 0;
}
