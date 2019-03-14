function mock(input) {
  let output = "";
  if (input.length > 0) {
    let count = 0;
    for (let i = 0; i < input.length; i++) {
      if (input[i] === " ") {
        output += input[i];
      } else {
        output +=
          count % 2 === 0 ? input[i].toLowerCase() : input[i].toUpperCase();
        count++;
      }
    }
    return output;
  } else {
    return input;
  }
}

module.exports = mock;
