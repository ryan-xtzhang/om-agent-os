import type { JsonObject, JsonValue } from "./json.js";

export interface ExecutionRequest {
  method: string;
  params: JsonObject;
}

export interface ExecutionResponse {
  ok: boolean;
  result?: JsonValue;
  error?: {
    code: string;
    message: string;
  };
}

export interface ExecutionClient {
  request(request: ExecutionRequest): Promise<ExecutionResponse>;
  close(): Promise<void>;
}
