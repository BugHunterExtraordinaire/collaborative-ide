import axios from "axios";

import { DefaultController } from "../types/express/functions";

import Session from "../models/Session";

const getContainers: DefaultController = async (req, res) => {
  const response = await axios.get('http://localhost:5000/containers');
  res.status(200).json(response.data);
}

const deleteContainer: DefaultController = async (req, res) => {
  const response = await axios.delete(`http://localhost:5000/containers/${req.params.id}`);
  res.status(200).json(response.data);
}

const getSessions: DefaultController = async (req, res) => {
  const sessions = await Session.find({});
  res.status(200).json(sessions);
}

export {
  getContainers,
  deleteContainer,
  getSessions,
}