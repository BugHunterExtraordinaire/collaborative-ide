export interface FilePayload {
  name: string;
  content: string;
}

export interface ExecutionRequest {
  files: Array<FilePayload>;
  language: 'python' | 'c++' | 'javascript';
}