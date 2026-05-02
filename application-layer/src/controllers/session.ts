import { DefaultController } from "../types/express/functions";
import crypto from 'crypto';
import OperationLog from "../models/OperationLog";
import Session from '../models/Session';
import { ForbiddenError, NotFoundError } from "../types/express/errors";

const createSession: DefaultController = async (req, res) => {
  const { name, owner, language } = req.body;

  const sessionId = crypto.randomBytes(4).toString('hex');

  const session = await Session.create({
    session_id: sessionId,
    name: name || `Session-${sessionId}`,
    owner,
    participants: [owner],
    language,
  });

  res.status(201).json(session);
}

const getSessions: DefaultController = async (req, res) => {

  const { username } = req.query;

  const sessions = await Session.find({
    $or: [
      { owner: username },
      { participants: username }
    ]
  })
    .select('session_id name owner createdAt')
    .sort({ createdAt: -1 })

  if (!sessions) throw new NotFoundError("No sessions were found.");

  res.status(200).json(sessions);
}

const getSession: DefaultController = async (req, res) => {
  const { id } = req.params;

  const session = await Session.findOne({
    session_id: id
  });

  if (!session) throw new NotFoundError(`No sesssion with id: ${id}`);

  res.status(200).json(session);
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
  getSessions,
  getSession,
  getSessionHistory,
  deleteSession
}