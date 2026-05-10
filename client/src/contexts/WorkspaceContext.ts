import { createContext } from "react";

import type { WorkspaceProps } from "../types/interfaces";

export const WorkspaceContext = createContext<WorkspaceProps | null>(null);