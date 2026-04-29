import { type DockerContainer } from "./interfaces";

export type ChatHistoryArray = Array<{
  username: string;
  message: string;
  timestamp: Date
}>;

export type SessionsArray = Array<{
  session_id: string;
  name: string;
  owner: string;
}>;

export type ContainerArray = Array<DockerContainer>;