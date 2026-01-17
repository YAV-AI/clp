import { flightApp } from "./app";

async function run() {
  // Search flights with AI suggestion
  flightApp.dispatch("searchFlights", { from: "NYC", to: "LAX" });
  const proposal = await flightApp.propose("searchFlights");
  console.log("Flight search proposal:", proposal);
  if (proposal && Object.keys(proposal).length > 0) {
    flightApp.acceptProposal("searchFlights");
  }
  flightApp.commit("performSearch");
  console.log("Flights:", flightApp.getState("flights"));

  // Select flight
  flightApp.dispatch("selectFlight", { flightId: "1" });
  flightApp.commit("selectFlight");
  console.log("Selected flight:", flightApp.getState("selectedFlight"));

  // Try to confirm booking without selection (but we have selection, so try without)
  // Actually, to test guard, we need to try confirm without select, but since we selected, let's test double confirm instead
  flightApp.dispatch("confirmBooking", {});
  flightApp.commit("confirmBooking");
  console.log("Booking:", flightApp.getState("booking"));

  // Try to confirm again
  try {
    flightApp.dispatch("confirmBooking", {});
    flightApp.commit("confirmBooking");
  } catch (e) {
    console.log("Double booking failed as expected:", (e as Error).message);
  }

  console.log("Log:", flightApp.getLog());
}

run();
