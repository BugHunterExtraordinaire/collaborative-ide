import type { DockerContainer, HistoryLog, SessionObject } from "./interfaces";

export type ChatHistoryArray = Array<{
  username: string;
  message: string;
  timestamp: Date;
}>;

export type SessionsArray = Array<SessionObject>;

export type ContainerArray = Array<DockerContainer>;

export type HistoryLogArray = Array<HistoryLog>;