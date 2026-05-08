export interface FilePayload {
  name: string;
  content: string;
}

export interface ExecutionResult {
  output: string;
  status: string;
  statusCode: number;
}