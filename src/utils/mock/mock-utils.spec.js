const { expect } = require("chai");
const { mock } = require("./mock-utils");

describe("mock-utils", () => {
  describe("mock()", () => {
    it("should mock a users input (single word)", () => {
      expect(mock("test")).to.equal("tEsT");
    });

    it("should mock a users input (sentence)", () => {
      expect(mock("test sentence with multiple words.")).to.equal(
        "tEsT sEnTeNcE wItH mUlTiPlE wOrDs."
      );
    });

    it("should return input if it is an empty string", () => {
      expect(mock("")).to.equal("");
    });

    it("should return undefined if no parameter was passed in", () => {
      expect(mock()).to.equal(undefined);
    });
  });
});
