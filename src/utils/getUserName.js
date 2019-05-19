function getUserName(user) {
  return user.slice(user.indexOf("|") + 1, user.length - 1);
}

module.exports = getUserName;
