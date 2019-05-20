function getUserId(user) {
  return user.slice(2, user.indexOf("|"));
}

module.exports = getUserId;
