import { Router } from "express";
import {
  chatController,
  createConversation,
  getConversationMessages,
  addConversationMessage
} from "../controllers/chat.controller.js";

export const chatRouter = Router();

chatRouter.post("/", chatController);
chatRouter.post("/conversations", createConversation);
chatRouter.get("/conversations/:id/messages", getConversationMessages);
chatRouter.post("/conversations/:id/messages", addConversationMessage);
