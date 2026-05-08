import { createContext } from "react";

import type { DashboardProps, UserDashboardProps } from "../types/interfaces";

export const DashboardContext = createContext<DashboardProps | null>(null);
export const UserDashboardContext = createContext<UserDashboardProps | null>(null);