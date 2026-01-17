export interface Intent {
  // Managed exclusively by the Engine
  name: string;
  payload: Record<string, any>;
  complete: boolean;
}

export interface IntentDef {
  inputs: Record<string, string>;
}
