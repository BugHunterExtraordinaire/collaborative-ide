import { DefaultController } from "../types/express/functions";
import crypto from 'crypto';
import OperationLog from "../models/OperationLog";
import Session from '../models/Session';
import { ForbiddenError } from "../types/express/errors";

const createSession: DefaultController = async (req, res) => {
  const { name, owner } = req.body;

  const sessionId = crypto.randomBytes(4).toString('hex');

  const newSession = new Session({
    session_id: sessionId,
    name: name || `Session-${sessionId}`,
    owner,
    participants: [owner],
  });

  await newSession.save();

  res.status(201).json(newSession);
}

const getSession: DefaultController = async (req, res) => {

  const { username } = req.query;

  const sessions = await Session.find({
    $or: [
      { owner: username },
      { participants: username }
    ]
  })
    .select('session_id name owner createdAt')
    .sort({ createdAt: -1 })
    .limit(10);

  res.status(200).json(sessions);
}

const getSessionHistory: DefaultController = async (req, res) => {
  const { id } = req.params;

  const logs = await OperationLog.find({ session_id: id }).sort({ timestamp: 1 });

  res.status(200).json(logs);
}

const deleteSession: DefaultController = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (role !== 'System Administrator') throw new ForbiddenError("Forbidden: Admins only.");

  await Session.findOneAndDelete({ session_id: id });
  await OperationLog.deleteMany({ session_id: id });

  res.status(200).json({ message: 'Session and history permanently deleted.' });
}

export {
  createSession,
  getSession,
  getSessionHistory,
  deleteSession
}