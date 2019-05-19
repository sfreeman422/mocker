const { expect } = require("chai");
const {
  capitalizeFirstLetter,
  define,
  formatDefs,
  formatUrbanD
} = require("./define-utils");

describe("define-utils", () => {
  describe("capitalizeFirstLetter()", () => {
    it("should capitalize the first letter of a given string", () => {
      expect(capitalizeFirstLetter("test string")).to.equal("Test string");
    });
  });

  describe("define()", () => {
    it("should return a promise when attempting to define", () => {
      expect(define("test")).to.be.a("Promise");
    });
  });

  describe("formatDefs()", () => {
    const testArray = [
      { definition: "one" },
      { definition: "two" },
      { definition: "three" },
      { definition: "four" },
      { definition: "five" }
    ];

    it("should return an array of 3 length when no maxDefs parameter is provided", () => {
      expect(formatDefs(testArray).length).to.equal(3);
    });

    it("should return an array of 4 length when a maxDefs parameter of 4 is provided", () => {
      expect(formatDefs(testArray, 4).length).to.equal(4);
    });

    it("should return testArray.length if maxDefs parameter is larger than testArray.length", () => {
      expect(formatDefs(testArray, 10).length).to.equal(5);
    });

    it(`should return [{ "Sorry, no definitions found" }] if defArr === 0`, () => {
      expect(formatDefs([])[0].text).to.equal("Sorry, no definitions found.");
    });
  });

  describe("formatUrbanD()", () => {
    it("should return a formatted urbandictionary string", () => {
      expect(formatUrbanD("A [way] to [test]")).to.equal("A *way* to *test*");
    });
  });
});
