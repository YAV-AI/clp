import { Intent } from "./intent";
import { State } from "./state";

export interface Context {
  intent: Intent;
  state: State;
}

export interface Guard {
  name: string;
  deny: (context: Readonly<Context>) => boolean;
}
