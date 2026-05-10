import { DefaultController } from "../types/functions";

const getHealth: DefaultController = async (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
}

export {
  getHealth
}