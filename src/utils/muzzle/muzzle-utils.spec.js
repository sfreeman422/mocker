const { expect } = require("chai");
const {
  isMuzzled,
  muzzled,
  addUserToMuzzled,
  removeMuzzle
} = require("./muzzle-utils");

describe("muzzle-utils", () => {
  const testUser = "test";
  beforeEach(() => {
    muzzled.length = 0;
    addUserToMuzzled(testUser);
  });
  describe("addUserToMuzzled()", () => {
    it("should add a user to the muzzled array", () => {
      expect(muzzled.length).to.equal(1);
      expect(isMuzzled(testUser)).to.equal(true);
    });
  });

  describe("removeMuzzle()", () => {
    it("should remove a user from the muzzled array", () => {
      expect(muzzled.length).to.equal(1);
      expect(isMuzzled(testUser)).to.equal(true);
      removeMuzzle(testUser);
      expect(isMuzzled(testUser)).to.equal(false);
      expect(muzzled.length).to.equal(0);
    });
  });

  describe("isMuzzled()", () => {
    it("should return true if a user is muzzled", () => {
      expect(isMuzzled(testUser)).to.equal(true);
    });

    it("should return false if a user is not muzzled", () => {
      removeMuzzle(testUser);
      expect(isMuzzled(testUser)).to.equal(false);
    });
  });
});
