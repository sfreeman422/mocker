const { expect } = require("chai");
const {
  isMuzzled,
  muzzled,
  addUserToMuzzled,
  removeMuzzle
} = require("./muzzle-utils");

describe("muzzle-utils", () => {
  it("should add a user to the muzzled array", () => {
    addUserToMuzzled("test");
    expect(muzzled.length).to.equal(1);
    expect(isMuzzled("test")).to.equal(true);
  });

  it("should remove a user from the muzzled array", () => {
    expect(isMuzzled("test")).to.equal(true);
    expect(muzzled.length).to.equal(1);
    removeMuzzle("test");
    expect(isMuzzled("test")).to.equal(false);
    expect(muzzled.length).to.equal(0);
  });
});
