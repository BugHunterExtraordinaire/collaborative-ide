import axios from "axios";

import { DefaultController } from "../types/express/functions";

export const getContainers: DefaultController = async (req, res) => {
  const executionUrl = process.env.EXECUTION_SERVICE_URL || 'http://localhost:5000';
  const response = await axios.get(`${executionUrl}/containers`);

  res.status(200).json(response.data);
}

export const deleteContainer: DefaultController = async (req, res) => {
  const { id } = req.params;
  
  const executionUrl = process.env.EXECUTION_SERVICE_URL || 'http://localhost:5000';
  await axios.delete(`${executionUrl}/containers/${id}`);

  res.status(200).json({ message: `Container ${id} terminated successfully.` });
}