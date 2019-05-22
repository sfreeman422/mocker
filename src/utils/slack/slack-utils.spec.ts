import { expect } from "chai";
import { getUserId, getUserName } from "./slack-utils";

const mockSlackIdString = "<@jrjrjr|U12345678>";
describe("slack-utils", () => {
  describe("getUserName()", () => {
    it("should return the username from a slack formatted id string", () => {
      expect(getUserName(mockSlackIdString)).to.equal("jrjrjr");
    });
  });
  describe("getUserId()", () => {
    it("should return the user id from a slack formatted id string", () => {
      expect(getUserId(mockSlackIdString)).to.equal("U12345678");
    });
  });
});
