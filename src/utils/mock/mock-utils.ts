export function mock(input: string): string {
  let output = "";
  if (!input || input.length === 0) {
    return input;
  } else {
    let shouldChangeCase = true;
    for (let i = 0; i < input.length; i++) {
      if (input[i] === " ") {
        output += input[i];
      } else {
        output += shouldChangeCase
          ? input[i].toLowerCase()
          : input[i].toUpperCase();
        shouldChangeCase = !shouldChangeCase;
      }
    }
    return output;
  }
}
