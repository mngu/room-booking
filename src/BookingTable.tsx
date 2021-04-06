import React, { ChangeEvent, ReactNode, useEffect, useState } from "react";
import { Web3Provider } from "@ethersproject/providers";
import { Contract } from "@ethersproject/contracts";
import { AddressZero } from "@ethersproject/constants";
import {
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@material-ui/core";
import { Alert, Color } from "@material-ui/lab";

import { formatTimeslot, shortenAddress } from "./utils";

enum Rooms {
  C01,
  C02,
  C03,
  C04,
  C05,
  C06,
  C07,
  C08,
  C09,
  C10,
  P01,
  P02,
  P03,
  P04,
  P05,
  P06,
  P07,
  P08,
  P09,
  P10,
}

enum ActionTypes {
  Book,
  Cancel,
}

type TimeslotAddresses = string[];

type BookingTableProps = {
  account: string;
  contract: Contract;
  library: Web3Provider;
};

const BookingTable = ({ account, contract, library }: BookingTableProps) => {
  // Contains last block number at app initialization
  const [blockNumber, setBlockNumber] = useState(0);
  const [businessHourStart, setBusinessHourStart] = useState<number>(0);
  // Contains current room to display the schedule for
  const [currentRoom, setCurrentRoom] = useState<Rooms>(Rooms.C01);
  // Contains an array of addresses representing who booked the current room for each timeslots
  const [timeslotAddresses, setTimeslotAddresses] = useState<TimeslotAddresses>(
    []
  );
  // Contains an array of rooms and timeslots awaiting booking or cancellation
  const [timeslotPending, setTimeslotPending] = useState<
    { room: Rooms; timeslot: number }[]
  >([]);
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | ReactNode>(
    ""
  );
  const [alertSeverity, setAlertSeverity] = useState<Color>("success");

  // Get the last Block number
  useEffect(() => {
    if (library) {
      library.getBlockNumber().then((blockNumber) => {
        setBlockNumber(blockNumber);
      });
    }
  }, [library]);

  useEffect(() => {
    if (contract && blockNumber) {
      // Get business hour start
      contract.businessHourStart().then((hour: number) => {
        setBusinessHourStart(hour);
      });

      // Set event listener for Confirmation event
      contract.on(
        "Confirmation",
        (sender, room, timeslot, actionType, event) => {
          if (event.blockNumber > blockNumber) {
            if (room === currentRoom) {
              fetchTimeslotAddresses(room);
            }
            const action =
              actionType === ActionTypes.Book ? "booking" : "cancelling";
            openSnackbar(
              <span>
                Confirmed {action} for room <strong>{Rooms[room]}</strong> at{" "}
                <strong>{formatTimeslot(timeslot)}</strong> by{" "}
                <strong>{shortenAddress(sender)}</strong>
              </span>
            );
            removeTimeslotPending(room, timeslot);
          }
        }
      );

      return () => {
        contract.removeAllListeners();
      };
    }
  }, [contract, currentRoom, blockNumber]);

  // Fetches timeslots when room changes
  useEffect(() => {
    fetchTimeslotAddresses(currentRoom);
  }, [currentRoom]);

  const fetchTimeslotAddresses = (room: Rooms) => {
    contract.getRoom(room).then((timeslotAddresses: TimeslotAddresses) => {
      setTimeslotAddresses(timeslotAddresses);
    });
  };

  const addTimeslotPending = (room: Rooms, timeslot: number) => {
    setTimeslotPending([...timeslotPending, { room, timeslot }]);
  };

  const removeTimeslotPending = (room: Rooms, timeslot: number) => {
    setTimeslotPending(
      timeslotPending.filter(
        (pending) => !(room === pending.room && timeslot === pending.timeslot)
      )
    );
  };

  const openSnackbar = (
    message: string | ReactNode,
    severity: Color = "success"
  ) => {
    setSnackbarMessage(message);
    setAlertSeverity(severity);
    setIsSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setIsSnackbarOpen(false);
  };

  const handleRoomChange = (evt: ChangeEvent<{ value: unknown }>) => {
    setCurrentRoom(Number(evt.target.value));
  };

  // Handle click on Book button
  const handleBooking = async (room: Rooms, timeslot: number) => {
    try {
      await contract.book(room, timeslot);
      addTimeslotPending(room, timeslot);
      openSnackbar(
        `Booking room ${Rooms[room]} at ${formatTimeslot(timeslot)}`,
        "warning"
      );
    } catch (err) {
      openSnackbar(
        `An error occurred: ${err.message || err.data?.message}`,
        "error"
      );
    }
  };

  // Handle cancel on Book button
  const handleCancelling = async (room: Rooms, timeslot: number) => {
    try {
      await contract.cancel(room, timeslot);
      addTimeslotPending(room, timeslot);
      openSnackbar(
        `Cancelling reservation for room ${Rooms[room]} at ${formatTimeslot(timeslot)}`,
        "warning"
      );
    } catch (err) {
      openSnackbar(
        `An error occurred: ${err.message || err.data?.message}`,
        "error"
      );
    }
  };

  return (
    <div>
      <FormControl fullWidth style={{ marginBottom: "2rem" }}>
        <InputLabel htmlFor="room-selector">Current room</InputLabel>
        <Select
          value={currentRoom}
          onChange={handleRoomChange}
          inputProps={{ id: "room-selector", "data-testid": "room-selector" }}
        >
          {Object.keys(Rooms)
            .filter((roomKey) => !isNaN(Number(roomKey)))
            .map((roomKey) => (
              <MenuItem key={Rooms[Number(roomKey)]} value={roomKey}>
                {Rooms[Number(roomKey)]}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timeslot</TableCell>
              <TableCell>Booked by</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {timeslotAddresses.map((address, index) => {
              const isFree = address === AddressZero;
              const isPending = !!timeslotPending.find(
                ({ room, timeslot }) =>
                  room === currentRoom && timeslot === index + businessHourStart
              );
              return (
                <TableRow key={index}>
                  <TableCell>
                    {formatTimeslot(index + businessHourStart)}
                  </TableCell>
                  <TableCell>
                    {address !== AddressZero ? (
                      <Chip
                        color={address === account ? "primary" : "default"}
                        label={shortenAddress(address)}
                      />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                      }}
                    >
                      {isPending && (
                        <CircularProgress
                          data-testid={`loader-${index}`}
                          size={20}
                          style={{ marginRight: "1rem" }}
                        />
                      )}
                      {address === account ? (
                        <Button
                          data-testid={`cancel-button-${index}`}
                          variant="contained"
                          color="secondary"
                          onClick={() =>
                            handleCancelling(
                              currentRoom,
                              index + businessHourStart
                            )
                          }
                          disabled={isPending}
                        >
                          Cancel
                        </Button>
                      ) : (
                        <Button
                          data-testid={`book-button-${index}`}
                          variant="contained"
                          color="primary"
                          onClick={() =>
                            handleBooking(
                              currentRoom,
                              index + businessHourStart
                            )
                          }
                          disabled={!isFree || isPending}
                        >
                          Book
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={isSnackbarOpen}
        onClose={handleSnackbarClose}
        autoHideDuration={10000}
      >
        <Alert severity={alertSeverity}>{snackbarMessage}</Alert>
      </Snackbar>
    </div>
  );
};

export default BookingTable;
