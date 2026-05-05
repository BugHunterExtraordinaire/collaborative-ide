import axios from "axios";

import { DefaultController } from "../types/express/functions";

export const getContainers: DefaultController = async (req, res) => {
  const response = await axios.get('http://localhost:5000/containers');
  res.status(200).json(response.data);
}

export const deleteContainer: DefaultController = async (req, res) => {
  const response = await axios.delete(`http://localhost:5000/containers/${req.params.id}`);
  res.status(200).json(response.data);
}