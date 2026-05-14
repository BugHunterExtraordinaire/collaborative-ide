import crypto from 'crypto';

import OperationLog from "../models/OperationLog";
import ExecutionLog from "../models/ExecutionLog";
import Session from '../models/Session';

import { ISession } from "../types/mongoose/interfaces";
import { DefaultController } from '../types/express/functions';
import { ForbiddenError, NotFoundError, UnauthenticatedError } from "../types/express/errors";

export const createSession: DefaultController = async (req, res) => {
  const { name, language } = req.body;
  const sessionId = crypto.randomBytes(4).toString('hex');
  const userId = req.user!.userId;

  const session = await Session.create({
    sessionId: sessionId,
    name: name || `Session-${sessionId}`,
    owner: userId,
    participants: [userId as string],
    language,
  });

  res.status(201).json({
    session,
    message: "Session created successfully!"
  });
}

export const getSessions: DefaultController = async (req, res) => {
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  let sessions: Array<ISession> = [];

  if (userRole === "System Administrator") {
    sessions = await Session.find({}).select("sessionId name owner createdAt").populate("owner");
  } else {
    sessions = await Session.find({ participants: userId }).select("sessionId name owner createdAt").populate("owner");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedSessions = sessions.map((session: any) => {
    const username = session.owner?.username || "Unavailable";
    const id = session.owner?._id || "Unavailable";

    return {
      sessionId: session.sessionId,
      name: session.name,
      owner: username,
      ownerId: id,
      createdAt: session.createdAt
    };
  });

  res.status(200).json(formattedSessions);
}

export const getSession: DefaultController = async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const session = await Session.findOne({ sessionId: id });
  if (!session) throw new NotFoundError(`No session with id: ${id}`);

  const isParticipant = session.participants.some(p => p.toString() === userId);
  if (!isParticipant) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session.participants.push(userId as any);
    await session.save();

  }

  res.status(200).json({
    session,
    message: `Welcome to session: ${session.name}`
  });
}

export const getSessionHistory: DefaultController = async (req, res) => {
  const { id } = req.params;

  const logs = await OperationLog.find({ sessionId: id }).sort({ timestamp: 1 });
  if (logs.length === 0) throw new NotFoundError("No operation logs were found for this session");

  res.status(200).json(logs);
}

export const deleteSession: DefaultController = async (req, res) => {
  const { id } = req.params;
  const role = req.user!.role;
  const userId = req.user!.userId;

  const session = await Session.findOne({ sessionId: id });
  if (!session) throw new NotFoundError(`No session was found with id: ${id}`);

  if (role !== 'System Administrator' && session.owner.toString() !== userId) throw new ForbiddenError("Forbidden: Only System Admins and session owners can delete this session");

  await Session.deleteOne({ sessionId: id });
  await OperationLog.deleteMany({ sessionId: id });
  await ExecutionLog.deleteMany({ sessionId: id });

  res.status(200).json({ message: 'Session and history permanently deleted!' });
}

export const getSessionAnalytics: DefaultController = async (req, res) => {
  const { id } = req.params;
  const role = req.user!.role;

  if (role !== "Instructor" && role !== "System Administrator") throw new UnauthenticatedError("Students are not authorized to view session analytics");

  const session = await Session.findOne({ sessionId: id });
  if (!session) throw new NotFoundError("Session not found");

  const executions = await ExecutionLog.find({ sessionId: id }).sort({ createdAt: -1 }).populate("userId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const executionStats = executions.reduce((acc: any, log: any) => {
    const username = log.userId?.username || "Unknown";

    if (!acc[username]) {
      acc[username] = { total: 0, success: 0, errors: 0 };
    }

    acc[username].total += 1;

    if (log.status === 'Success') {
      acc[username].success += 1;
    } else {
      acc[username].errors += 1;
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