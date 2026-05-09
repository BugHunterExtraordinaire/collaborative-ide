import axios from "axios";

import { config } from "../config/env";

import { DefaultController } from "../types/express/functions";

export const getContainers: DefaultController = async (req, res) => {
  const response = await axios.get(`${config.EXECUTION_LAYER_URL}/containers`);

  res.status(200).json(response.data);
}

export const deleteContainer: DefaultController = async (req, res) => {
  const { id } = req.params;
  
  await axios.delete(`${config.EXECUTION_LAYER_URL}/containers/${id}`);

  res.status(200).json({ message: `Container ${id} terminated successfully.` });
}