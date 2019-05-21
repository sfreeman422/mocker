export function getUserId(user: string) {
  return user.slice(2, user.indexOf("|"));
}
