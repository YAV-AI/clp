import { Context } from "./guard";

export interface Transition {
  when: (context: Readonly<Context>) => boolean;
  effects: (context: Readonly<Context>) => Record<string, any>;
}
