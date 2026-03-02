import { createContract } from "../../packages/clp";

export const flightContract = createContract({
  intents: {
    searchFlights: {
      inputs: {
        from: "string",
        to: "string",
        date: "string?",
      },
    },
    selectFlight: {
      inputs: {
        flightId: "string",
      },
    },
    confirmBooking: {
      inputs: {},
    },
  },

  state: {
    flights: "array",
    selectedFlight: "string?",
    booking: "object?",
  },

  guards: [
    {
      name: "no_past_dates",
      deny: (context) => {
        if (
          context.intent.name === "searchFlights" &&
          context.intent.payload.date
        ) {
          const date = new Date(context.intent.payload.date);
          return date < new Date();
        }
        return false;
      },
    },
    {
      name: "flight_must_exist_for_select",
      deny: (context) => {
        if (context.intent.name === "selectFlight") {
          const flights = context.state.flights || [];
          return !flights.some(
            (f: any) => f.id === context.intent.payload.flightId,
          );
        }
        return false;
      },
    },
    {
      name: "cannot_confirm_without_selection",
      deny: (context) => {
        if (context.intent.name === "confirmBooking") {
          return !context.state.selectedFlight;
        }
        return false;
      },
    },
    {
      name: "cannot_confirm_twice",
      deny: (context) => {
        if (context.intent.name === "confirmBooking") {
          return !!context.state.booking;
        }
        return false;
      },
    },
  ],

  transitions: {
    performSearch: {
      when: (context) =>
        context.intent.name === "searchFlights" && context.intent.complete,
      effects: (context) => ({
        flights: [
          {
            id: "1",
            from: context.intent.payload.from,
            to: context.intent.payload.to,
            date: context.intent.payload.date,
          },
        ],
        selectedFlight: undefined,
      }),
    },
    selectFlight: {
      when: (context) =>
        context.intent.name === "selectFlight" && context.intent.complete,
      effects: (context) => ({
        selectedFlight: context.intent.payload.flightId,
      }),
    },
    confirmBooking: {
      when: (context) =>
        context.intent.name === "confirmBooking" && context.intent.complete,
      effects: (context) => ({
        booking: {
          flightId: context.state.selectedFlight,
          status: "confirmed",
        },
      }),
    },
  },
});
