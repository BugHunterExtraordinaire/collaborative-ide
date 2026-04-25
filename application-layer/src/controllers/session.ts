import { DefaultController } from "../types/express/functions";
import crypto from 'crypto';
import OperationLog from "../models/OperationLog";
import Session from '../models/Session';

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

export {
  createSession,
  getSession,
  getSessionHistory,
}