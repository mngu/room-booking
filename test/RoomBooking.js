const RoomBooking = artifacts.require("RoomBooking");
const { AddressZero } = require("@ethersproject/constants");
require("chai").use(require("chai-as-promised")).should();

contract("RoomBooking", (accounts) => {
  let roomBooking, businessHourStart, businessHourEnd;

  beforeEach(async () => {
    roomBooking = await RoomBooking.new();
    businessHourStart = (await roomBooking.businessHourStart()).toNumber();
    businessHourEnd = (await roomBooking.businessHourEnd()).toNumber();
  });

  it("should throw if trying to book outside of business hours", async () => {
    await Promise.all([
      roomBooking.book(0, -1).should.be.rejected,
      roomBooking.book(0, 6).should.be.rejected,
      roomBooking.book(0, 7).should.be.rejected,
      roomBooking.book(0, businessHourStart).should.not.be.rejected,
      roomBooking.book(0, businessHourEnd - 1).should.not.be.rejected,
      roomBooking.book(0, businessHourEnd).should.be.rejected,
      roomBooking.book(0, 19).should.be.rejected,
      roomBooking.book(0, 20).should.be.rejected,
    ]);
  });

  it("should returns reservations for a room", async () => {
    const reservations = await roomBooking.getRoom(0);
    expect(reservations).to.be.an("array");
    expect(reservations).to.be.length(businessHourEnd - businessHourStart);
  });

  it("should throw if room does not exists", async () => {
    await Promise.all([
      roomBooking.getRoom(0).should.not.be.rejected,
      roomBooking.getRoom(19).should.not.be.rejected,
      roomBooking.getRoom(-1).should.be.rejected,
      roomBooking.getRoom(20).should.be.rejected,
    ]);
  });

  it("should book a room", async () => {
    await roomBooking.book(0, businessHourStart, { from: accounts[1] });
    const reservationsRoom0 = await roomBooking.getRoom(0);
    expect(reservationsRoom0[0]).to.be.eq(accounts[1]);
  });

  it("should throw if booking a not-available room", async () => {
    await roomBooking.book(0, businessHourStart, { from: accounts[1] });
    await roomBooking
      .book(0, businessHourStart, { from: accounts[0] })
      .should.be.rejectedWith("The room is already booked.");
  });

  it("should cancel a booking", async () => {
    await roomBooking.book(2, businessHourStart + 5, { from: accounts[1] });
    await roomBooking.cancel(2, businessHourStart + 5, { from: accounts[1] });
    const reservationsRoom2 = await roomBooking.getRoom(2);

    expect(reservationsRoom2[2]).to.be.eq(AddressZero);
  });

  it("should throw if cancelling a room not booked by the same user", async () => {
    await roomBooking.book(2, businessHourStart + 5, { from: accounts[1] });
    await roomBooking
      .cancel(2, businessHourStart + 5, { from: accounts[0] })
      .should.be.rejectedWith("The room was not booked by sender.");
  });
});
