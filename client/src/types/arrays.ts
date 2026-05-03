import type { DockerContainer, HistoryLog } from "./interfaces";

export type ChatHistoryArray = Array<{
  username: string;
  message: string;
  timestamp: Date
}>;

export type SessionsArray = Array<{
  sessionId: string;
  name: string;
  owner: string;
}>;

export type ContainerArray = Array<DockerContainer>;

export type HistoryLogArray = Array<HistoryLog>;