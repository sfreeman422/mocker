import { expect } from "chai";
import {
  addUserToMuzzled,
  isMuzzled,
  muzzled,
  removeMuzzle
} from "./muzzle-utils";

describe("muzzle-utils", () => {
  const testData = {
    user: "test-user",
    friendlyName: "test-muzzler",
    requestor: "test-requestor"
  };

  beforeEach(() => {
    muzzled.length = 0;
    addUserToMuzzled(testData.user, testData.friendlyName, testData.requestor);
  });

  describe("addUserToMuzzled()", () => {
    it("should add a user to the muzzled array", () => {
      expect(muzzled.length).to.equal(1);
      expect(isMuzzled(testData.user)).to.equal(true);
    });
  });

  describe("removeMuzzle()", () => {
    it("should remove a user from the muzzled array", () => {
      expect(muzzled.length).to.equal(1);
      expect(isMuzzled(testData.user)).to.equal(true);
      removeMuzzle(testData.user);
      expect(isMuzzled(testData.user)).to.equal(false);
      expect(muzzled.length).to.equal(0);
    });
  });

  describe("isMuzzled()", () => {
    it("should return true if a user is muzzled", () => {
      expect(isMuzzled(testData.user)).to.equal(true);
    });

    it("should return false if a user is not muzzled", () => {
      removeMuzzle(testData.user);
      expect(isMuzzled(testData.user)).to.equal(false);
    });
  });
});
