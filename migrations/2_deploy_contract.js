const RoomBooking = artifacts.require("RoomBooking");

module.exports = function(deployer) {
  deployer.deploy(RoomBooking);
};