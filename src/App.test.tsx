import React from "react";
import { render } from "@testing-library/react";
import App from "./App";
import Web3React from "@web3-react/core";

describe("App", () => {
  it("should display warning message when Metamask is not connected", async () => {
    Web3React.useWeb3React = jest.fn().mockReturnValue({
      account: null,
      activate: () => {},
      error: "Error connecting",
    });
    const { findByText } = render(
      <Web3React.Web3ReactProvider getLibrary={() => {}}>
        <App />
      </Web3React.Web3ReactProvider>
    );
    const warningMessage = await findByText(
      /Please connect using Metamask./
    );
    expect(warningMessage).toBeInTheDocument();
  });

  it("should display the shortened address account if connected", async () => {
    Web3React.useWeb3React = jest
      .fn()
      .mockReturnValue({ account: "AccountAddress", activate: () => {} });
    const { findByText } = render(
      <Web3React.Web3ReactProvider getLibrary={() => {}}>
        <App />
      </Web3React.Web3ReactProvider>
    );
    const accountAddress = await findByText(/Accoun...ddress/);
    expect(accountAddress).toBeInTheDocument();
  });
});
