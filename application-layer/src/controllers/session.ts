import { DefaultController } from "../types/express/functions";
import crypto from 'crypto';
import OperationLog from "../models/OperationLog";
import ExecutionLog from "../models/ExecutionLog";
import Session from '../models/Session';
import { ForbiddenError, NotFoundError } from "../types/express/errors";

const createSession: DefaultController = async (req, res) => {
  const { name, language } = req.body;
  const sessionId = crypto.randomBytes(4).toString('hex');
  const userId = req.user?.userId;

  const session = await Session.create({
    sessionId: sessionId,
    name: name || `Session-${sessionId}`,
    owner: userId,
    participants: [userId as string],
    language,
  });

  res.status(201).json(session);
}

const getSessions: DefaultController = async (req, res) => {
  const userId = req.user?.userId;

  const sessions = await Session.find({ participants: userId })
    .populate('owner', 'username') 
    .sort({ createdAt: -1 });

  const formattedSessions = sessions.map(session => ({
    sessionId: session.sessionId,
    name: session.name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    owner: (session.owner as any).username, 
    createdAt: session.created_at
  }));

  res.status(200).json(formattedSessions);
}

const getSession: DefaultController = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  const session = await Session.findOne({ sessionId: id });

  if (!session) throw new NotFoundError(`No session with id: ${id}`);

  if (userId) {
    const isParticipant = session.participants.some(p => p.toString() === userId);
    if (!isParticipant) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session.participants.push(userId as any);
      await session.save();
    }
  }

  res.status(200).json(session);
}

const getSessionHistory: DefaultController = async (req, res) => {
  const { id } = req.params;
  const logs = await OperationLog.find({ sessionId: id }).sort({ timestamp: 1 });
  res.status(200).json(logs);
}

const deleteSession: DefaultController = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (role !== 'System Administrator') throw new ForbiddenError("Forbidden: Admins only.");

  await Session.findOneAndDelete({ sessionId: id });
  await OperationLog.deleteMany({ sessionId: id });

  res.status(200).json({ message: 'Session and history permanently deleted.' });
}

const getSessionAnalytics: DefaultController = async (req, res) => {
  const { id } = req.params;

  const session = await Session.findOne({ sessionId: id });
  if (!session) throw new NotFoundError("Session not found");

  const executions = await ExecutionLog.find({ sessionId: id }).sort({ createdAt: -1 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const executionStats = executions.reduce((acc: any, log) => {
    if (!acc[log.username]) {
      acc[log.username] = { total: 0, success: 0, errors: 0 };
    }
    acc[log.username].total += 1;

    if (log.status === 'Success') {
      acc[log.username].success += 1;
    } else {
      acc[log.username].errors += 1;
    }
    return acc;
  }, {});

  res.status(200).json({
    sessionDetails: {
      id: session.sessionId,
      name: session.name,
      language: session.language,
      chatHistory: session.chatHistory || [],
    },
    pedagogicalTracking: executionStats,
    rawExecutionLogs: executions
  });
}

export {
  createSession,
  getSessions,
  getSession,
  getSessionHistory,
  deleteSession,
  getSessionAnalytics,
}