import axios from "axios";

import { config } from "../config/env";

import { DefaultController } from "../types/express/functions";
import { UnauthenticatedError } from "../types/express/errors";

export const getContainers: DefaultController = async (req, res) => {
  const role = req.user!.role;

  if (role !== "System Administrator") throw new UnauthenticatedError("Only system administrator are authorized to access this route");

  const response = await axios.get(`${config.EXECUTION_LAYER_URL}/api/v1/containers`);

  res.status(200).json(response.data);
}

export const deleteContainer: DefaultController = async (req, res) => {
  const { id } = req.params;
  const role = req.user?.role;

  if (role !== "System Administrator") throw new UnauthenticatedError("Only system administrator are authorized to access this route");
  
  await axios.delete(`${config.EXECUTION_LAYER_URL}/api/v1/containers/${id}`);

  res.status(200).json({ message: `Container ${id} terminated successfully.` });
}