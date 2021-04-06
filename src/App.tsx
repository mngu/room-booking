import React, { useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";
import { Contract } from "@ethersproject/contracts";
import { InjectedConnector } from "@web3-react/injected-connector";
import { Chip, Container, CssBaseline, Grid } from "@material-ui/core";
import { Alert, AlertTitle } from "@material-ui/lab";
import LocalDrinkIcon from "@material-ui/icons/LocalDrink";
import RoomBooking from "./abi/RoomBooking.json";
import BookingTable from "./BookingTable";
import { shortenAddress } from "./utils";

const NETWORK_ID = 5777,
  CHAIN_ID = 1337;

const injectedConnector = new InjectedConnector({
  supportedChainIds: [CHAIN_ID],
});

const App = () => {
  const {
    account,
    activate,
    active,
    library,
    error,
  } = useWeb3React<Web3Provider>();
  const [contract, setContract] = useState<Contract>();

  // Connect the wallet
  useEffect(() => {
    activate(injectedConnector);
  }, [activate]);

  // Instantiate the Contract
  useEffect(() => {
    if (library) {
      const contractAddress = RoomBooking.networks[NETWORK_ID].address;
      const contractAbi = RoomBooking.abi;
      const contract = new Contract(
        contractAddress,
        contractAbi,
        library.getSigner()
      );
      setContract(contract);
    }
  }, [library]);

  return (
    <Container maxWidth="sm">
      <CssBaseline />
      <Grid container alignItems="center" style={{ marginBottom: "2rem" }}>
        <Grid item sm={6}>
          <h1
            style={{
              display: "inline-flex",
              alignItems: "center",
              backgroundColor: "#EE1331",
              color: "white",
              padding: "0.5rem 1rem",
              margin: 0,
            }}
          >
            <LocalDrinkIcon style={{ marginRight: "0.5rem" }} />
            Cola day
          </h1>
        </Grid>
        {account && (
          <Grid container item justify="flex-end" sm={6}>
            <div>
              Connected as:{" "}
              <Chip label={shortenAddress(account)} color="primary" />
            </div>
          </Grid>
        )}
      </Grid>
      {error && (
        <Alert severity="warning">
          <AlertTitle>Please connect using Metamask.</AlertTitle>
          <p>{error.message}</p>
        </Alert>
      )}
      {active && account && contract && library && (
        <BookingTable account={account} contract={contract} library={library} />
      )}
    </Container>
  );
};

export default App;
