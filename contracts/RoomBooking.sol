// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12 <0.9.0;

contract RoomBooking {
    enum RoomNames {C01, C02, C03, C04, C05, C06, C07, C08, C09, C10, P01, P02, P03, P04, P05, P06, P07, P08, P09, P10}
    enum ActionTypes {Book, Cancel}
    uint8 constant public businessHourStart = 8;
    uint8 constant public businessHourEnd = 18;
    uint8 constant timeslotsLength = businessHourEnd - businessHourStart;

    mapping (RoomNames => address[timeslotsLength]) private rooms;
    event Confirmation(address sender, RoomNames room, uint8 timeslot, ActionTypes actionType);

    modifier isWithinBusinessHours(uint8 timeslot) {
        require(timeslot >= businessHourStart && timeslot < businessHourEnd, 'Hours should be within 8 and 18.');
        _;
    }

    function book(RoomNames room, uint8 timeslot) public isWithinBusinessHours(timeslot) {
        uint8 timeslotIndex = timeslot - businessHourStart;
        require(rooms[room][timeslotIndex] == address(0), 'The room is already booked.');

        rooms[room][timeslotIndex] = msg.sender;
        emit Confirmation(msg.sender, room, timeslot, ActionTypes.Book);
    }

    function cancel(RoomNames room, uint8 timeslot) public isWithinBusinessHours(timeslot) {
        uint8 timeslotIndex = timeslot - businessHourStart;
        require(rooms[room][timeslotIndex] == msg.sender, 'The room was not booked by sender.');

        rooms[room][timeslotIndex] = address(0);
        emit Confirmation(msg.sender, room, timeslot, ActionTypes.Cancel);
    }

    function getRoom(RoomNames room) public view returns(address[timeslotsLength] memory) {
        return rooms[room];
    }
}