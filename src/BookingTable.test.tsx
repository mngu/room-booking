import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react";
import BookingTable from "./BookingTable";
import { Web3Provider } from "@ethersproject/providers";
import { AddressZero } from "@ethersproject/constants";

describe("BookingTable", () => {
  let mockContract: any, mockAccount: string, mockLibrary: Web3Provider;
  beforeEach(() => {
    mockContract = {
      businessHourStart: jest.fn().mockResolvedValue(8),
      getRoom: jest.fn().mockResolvedValue(Array(10).fill(AddressZero)),
      on: jest.fn(),
      removeAllListeners: jest.fn(),
      book: jest.fn(),
      cancel: jest.fn(),
    };
    mockAccount = "0xd3F0a2F406674c2c16172242310DD55B1BEa35eD";
    mockLibrary = ({
      getBlockNumber: jest.fn().mockResolvedValue(12),
    } as unknown) as Web3Provider;
  });

  it("should display the booking table", async () => {
    const { getByText } = render(
      <BookingTable
        account={mockAccount}
        contract={mockContract}
        library={mockLibrary}
      />
    );
    await waitFor(() => {
      expect(getByText("Current room")).toBeInTheDocument();
      expect(getByText("Timeslot")).toBeInTheDocument();
      expect(getByText("8am")).toBeInTheDocument();
      expect(getByText("5pm")).toBeInTheDocument();
    });
  });

  it("should navigate between rooms", async () => {
    mockContract.getRoom = jest
      .fn()
      // First call
      .mockResolvedValueOnce(Array(10).fill(AddressZero))
      // Second call on room change
      .mockResolvedValueOnce(Array(10).fill(mockAccount))
      // Third call, go back to first room
      .mockResolvedValueOnce(Array(10).fill(AddressZero));
    const { getAllByText, getByTestId } = render(
      <BookingTable
        account={mockAccount}
        contract={mockContract}
        library={mockLibrary}
      />
    );
    fireEvent.change(getByTestId("room-selector"), { target: { value: 1 } });
    await waitFor(() => {
      expect(getAllByText("0xd3F0...Ea35eD")).toHaveLength(10);
    });
    fireEvent.change(getByTestId("room-selector"), { target: { value: 0 } });
    await waitFor(() => {
      expect(getAllByText("-")).toHaveLength(10);
    });
  });

  it("should show warning message and loader when booking a room", async () => {
    const { findByTestId, getByTestId, getByText } = render(
      <BookingTable
        account={mockAccount}
        contract={mockContract}
        library={mockLibrary}
      />
    );
    const button = await findByTestId("book-button-0");
    fireEvent.click(button);
    await waitFor(() => {
      // Warning message should display
      expect(getByText("Booking room C01 at 8am")).toBeInTheDocument();
      // Loader should display
      expect(getByTestId("loader-0")).toBeVisible();
    });
  });

  it("should show warning message and loader when cancelling a room", async () => {
    // Simulating that the first room was already booked by mock account
    mockContract.getRoom = jest
      .fn()
      .mockResolvedValue([mockAccount, ...Array(9).fill(AddressZero)]);

    const { findByTestId, getByTestId, getByText } = render(
      <BookingTable
        account={mockAccount}
        contract={mockContract}
        library={mockLibrary}
      />
    );
    const button = await findByTestId("cancel-button-0");
    fireEvent.click(button);
    await waitFor(() => {
      expect(getByText("Cancelling reservation for room C01 at 8am")).toBeInTheDocument();
      expect(getByTestId("loader-0")).toBeVisible();
    });
  });
});
