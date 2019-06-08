import { IMuzzled, IMuzzler } from "../../shared/models/muzzle/muzzle-models";
// Store for the muzzled users.
export const muzzled: Map<string, IMuzzled> = new Map();
// STore for people who are muzzling others.
export const muzzlers: Map<string, IMuzzler> = new Map();

// Time period in which a user must wait before making more muzzles.
const MAX_MUZZLE_TIME = 3600000;
const MAX_TIME_BETWEEN_MUZZLES = 3600000;
export const MAX_MUZZLES = 2;
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
  if (muzzled.has(toMuzzle)) {
    console.error(
      `${requestor} attempted to muzzle ${toMuzzle} but ${toMuzzle} is already muzzled.`
    );
    throw new Error(`${friendlyMuzzle} is already muzzled!`);
  } else if (muzzled.has(requestor)) {
    console.error(
      `User: ${requestor} attempted to muzzle ${toMuzzle} but failed because requestor: ${requestor} is currently muzzled`
    );
    throw new Error(`You can't muzzle someone if you are already muzzled!`);
  } else if (
    muzzlers.has(requestor) &&
    muzzlers.get(requestor)!.muzzleCount === MAX_MUZZLES
  ) {
    console.error(
      `User: ${requestor} attempted to muzzle ${toMuzzle} but failed because requestor: ${requestor} has reached maximum muzzle of ${MAX_MUZZLES}`
    );
    throw new Error(
      `You're doing that too much. Only ${MAX_MUZZLES} muzzles are allowed per hour.`
    );
  } else {
    // Add a newly muzzled user.
    muzzled.set(toMuzzle, {
      suppressionCount: 0,
      muzzledBy: requestor
    });
    const muzzleCount = muzzlers.has(requestor)
      ? ++muzzlers.get(requestor)!.muzzleCount
      : 1;
    // Add requestor to muzzlers
    muzzlers.set(requestor, {
      muzzleCount,
      muzzleCountRemover: setTimeout(
        () => decrementMuzzleCount(requestor),
        MAX_TIME_BETWEEN_MUZZLES
      )
    });

    if (
      muzzlers.has(requestor) &&
      muzzlers.get(requestor)!.muzzleCountRemover
    ) {
      const currentTimer = muzzlers.get(requestor)!.muzzleCountRemover;
      clearTimeout(currentTimer as NodeJS.Timeout);

      muzzlers.set(requestor, {
        muzzleCount: muzzlers.get(requestor)!.muzzleCount,
        muzzleCountRemover: setTimeout(
          () =>
            muzzlers.get(requestor)!.muzzleCount === MAX_MUZZLES
              ? removeMuzzler(requestor)
              : decrementMuzzleCount(requestor),
          MAX_MUZZLE_TIME
        )
      });
    }
    console.log(
      `${friendlyMuzzle} is now muzzled for ${timeToMuzzle} milliseconds`
    );
    return `Succesfully muzzled ${friendlyMuzzle} for ${
      +seconds === 60
        ? minutes + 1 + "m00s"
        : minutes + "m" + (+seconds < 10 ? "0" : "") + seconds + "s"
    } minutes`;
  }
}

export function decrementMuzzleCount(requestor: string) {
  if (muzzlers.has(requestor)) {
    const decrementedMuzzle = --muzzlers.get(requestor)!.muzzleCount;
    muzzlers.set(requestor, {
      muzzleCount: decrementedMuzzle,
      muzzleCountRemover: muzzlers.get(requestor)!.muzzleCountRemover
    });
    console.log(
      `Successfully decremented ${requestor} muzzleCount to ${decrementedMuzzle}`
    );
  } else {
    console.error(
      `Attemped to decrement muzzle count for ${requestor} but they did not exist!`
    );
  }
}

export function removeMuzzler(user: string) {
  muzzlers.delete(user);
  console.log(
    `${MAX_MUZZLE_TIME} has passed since ${user} last successful muzzle. They have been removed from muzzlers.`
  );
}

export function removeMuzzle(user: string) {
  muzzled.delete(user);
  console.log(`Removed ${user}'s muzzle! He is free at last.`);
}

export function isRandomEven() {
  return Math.floor(Math.random() * 2) % 2 === 0;
}
