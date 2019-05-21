export function getUserName(user: string) {
  return user.slice(user.indexOf("|") + 1, user.length - 1);
}
