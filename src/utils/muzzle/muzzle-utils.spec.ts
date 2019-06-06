import { expect } from "chai";
import {
  addUserToMuzzled,
  muzzled,
  muzzlers,
  removeMuzzle
} from "./muzzle-utils";

describe("muzzle-utils", () => {
  const testData = {
    user: "test-user",
    user2: "test-user2",
    friendlyName: "test-muzzler",
    requestor: "test-requestor"
  };

  beforeEach(() => {
    muzzled.clear();
    muzzlers.clear();
    addUserToMuzzled(testData.user, testData.friendlyName, testData.requestor);
  });

  describe("addUserToMuzzled()", () => {
    describe("muzzled", () => {
      it("should add a user to the muzzled map", () => {
        expect(muzzled.size).to.equal(1);
        expect(muzzled.has(testData.user)).to.equal(true);
      });

      it("should return an added user with IMuzzled attributes", () => {
        expect(muzzled.get(testData.user)!.suppressionCount).to.equal(0);
        expect(muzzled.get(testData.user)!.muzzledBy).to.equal(
          testData.requestor
        );
      });

      it("should throw an error if a user tries to muzzle an already muzzled user", () => {
        expect(muzzled.has(testData.user)).to.equal(true);
        expect(() =>
          addUserToMuzzled(
            testData.user,
            testData.friendlyName,
            testData.requestor
          )
        ).to.throw();
      });

      it("should throw an error if a requestor tries to muzzle someone while the requestor is muzzled", () => {
        expect(muzzled.has(testData.user)).to.equal(true);
        expect(() =>
          addUserToMuzzled(
            testData.requestor,
            testData.friendlyName,
            testData.user
          )
        ).to.throw();
      });
    });

    describe("muzzlers", () => {
      it("should add a user to the muzzlers map", () => {
        expect(muzzlers.size).to.equal(1);
        expect(muzzlers.has(testData.requestor)).to.equal(true);
      });

      it("should return an added user with IMuzzler attributes", () => {
        expect(muzzlers.get(testData.requestor)!.muzzleCount).to.equal(1);
      });

      it("should increment a requestors muzzle count on a second addUserToMuzzled() call", () => {
        addUserToMuzzled(
          testData.user2,
          testData.friendlyName,
          testData.requestor
        );
        expect(muzzled.size).to.equal(2);
        expect(muzzlers.has(testData.requestor)).to.equal(true);
        expect(muzzlers.get(testData.requestor)!.muzzleCount).to.equal(2);
      });
    });
  });

  describe("removeMuzzle()", () => {
    it("should remove a user from the muzzled array", () => {
      expect(muzzled.size).to.equal(1);
      expect(muzzled.has(testData.user)).to.equal(true);
      removeMuzzle(testData.user);
      expect(muzzled.has(testData.user)).to.equal(false);
      expect(muzzled.size).to.equal(0);
    });
  });
});
