import { DefaultController } from "../types/express/functions";
import crypto from 'crypto';
import Session from '../models/Session'; 

const createSession: DefaultController = async (req, res) => {
  const { name, language } = req.body;
  
  const sessionId = crypto.randomBytes(4).toString('hex'); 


  const newSession = new Session({
    session_id: sessionId,
    name: name || `Session-${sessionId}`, 
  });

  await newSession.save();
  
  res.status(201).json(newSession);
}

const getSession: DefaultController = async (req, res) => {

  const sessions = await Session.find()
    .select('session_id name created_at')
    .sort({ created_at: -1 })
    .limit(10); 
    
  res.status(200).json(sessions);
}

export {
  createSession,
  getSession
}