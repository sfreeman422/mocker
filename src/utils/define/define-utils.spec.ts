import { expect } from "chai";
import { IDefinition } from "../../shared/models/define/define-models";
import {
  capitalizeFirstLetter,
  define,
  formatDefs,
  formatUrbanD
} from "./define-utils";

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
      expect(formatUrbanD("A [way] to [test]")).to.equal("A way to test");
    });
  });
});

const testArray: IDefinition[] = [
  {
    definition: "one",
    permalink: "https://urbandictionary.com/whatever",
    thumbs_up: 12,
    author: "jr",
    word: "one",
    defid: 1,
    written_on: "whatever", // ISO Date
    example: "test",
    thumbs_down: 14,
    current_vote: "test",
    sound_urls: ["test"]
  },
  {
    definition: "two",
    permalink: "https://urbandictionary.com/whatever",
    thumbs_up: 12,
    author: "jr",
    word: "two",
    defid: 1,
    written_on: "whatever", // ISO Date
    example: "test",
    thumbs_down: 14,
    current_vote: "test",
    sound_urls: ["test"]
  },
  {
    definition: "three",
    permalink: "https://urbandictionary.com/whatever",
    thumbs_up: 12,
    author: "jr",
    word: "three",
    defid: 1,
    written_on: "whatever", // ISO Date
    example: "test",
    thumbs_down: 14,
    current_vote: "test",
    sound_urls: ["test"]
  },
  {
    definition: "four",
    permalink: "https://urbandictionary.com/whatever",
    thumbs_up: 12,
    author: "jr",
    word: "four",
    defid: 1,
    written_on: "whatever", // ISO Date
    example: "test",
    thumbs_down: 14,
    current_vote: "test",
    sound_urls: ["test"]
  },
  {
    definition: "five",
    permalink: "https://urbandictionary.com/whatever",
    thumbs_up: 12,
    author: "jr",
    word: "five",
    defid: 1,
    written_on: "whatever", // ISO Date
    example: "five",
    thumbs_down: 14,
    current_vote: "test",
    sound_urls: ["test"]
  }
];
