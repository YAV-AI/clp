import { Context } from "./guard";

export interface Evaluation {
  name: string;
  validate: (context: Readonly<Context>) => boolean;
}
