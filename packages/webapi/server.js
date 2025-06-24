import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AzureChatOpenAI } from "@langchain/openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { BufferMemory } from "langchain/memory";
import { ChatMessageHistory } from "langchain/stores/message/in_memory";
import { AgentService } from "./agentService.js";

// Load env variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const sessionMemories = {};
const agentService = new AgentService();

function getSessionMemory(sessionId) {
  if (!sessionMemories[sessionId]) {
    const history = new ChatMessageHistory();
    sessionMemories[sessionId] = new BufferMemory({
      chatHistory: history,
      returnMessages: true,
      memoryKey: "chat_history",
    });
  }
  return sessionMemories[sessionId];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");
const pdfPath = path.join(projectRoot, "data/employee_handbook.pdf");

const chatModel = new AzureChatOpenAI({
  azureOpenAIApiKey: process.env.AZURE_INFERENCE_SDK_KEY,
  azureOpenAIApiInstanceName: process.env.INSTANCE_NAME,
  azureOpenAIApiDeploymentName: process.env.DEPLOYMENT_NAME,
  azureOpenAIApiVersion: "2024-08-01-preview",
  temperature: 1,
  maxTokens: 4096,
});

let pdfText = null;
let pdfChunks = [];
const CHUNK_SIZE = 800;

async function loadPDF() {
  if (pdfText) return pdfText;

  if (!fs.existsSync(pdfPath)) return "PDF not found.";

  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(dataBuffer);
  pdfText = data.text;
  let currentChunk = "";
  const words = pdfText.split(/\s+/);

  for (const word of words) {
    if ((currentChunk + " " + word).length <= CHUNK_SIZE) {
      currentChunk += (currentChunk ? " " : "") + word;
    } else {
      pdfChunks.push(currentChunk);
      currentChunk = word;
    }
  }

  if (currentChunk) pdfChunks.push(currentChunk);
  return pdfText;
}

function retrieveRelevantContent(query) {
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 3)
    .map((term) => term.replace(/[.,?!;:()"']/g, ""));

  if (queryTerms.length === 0) return [];

  const scoredChunks = pdfChunks.map((chunk) => {
    const chunkLower = chunk.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      const regex = new RegExp(term, "gi");
      const matches = chunkLower.match(regex);
      if (matches) score += matches.length;
    }
    return { chunk, score };
  });

  return scoredChunks
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.chunk);
}

// ============================================
//              CHAT ROUTE LOGIC
// ============================================

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const sessionId = req.body.sessionId || "default";
  const useRAG = req.body.useRAG !== false;
  const mode = req.body.mode || "basic";

  // 🔁 Agent mode override
  if (mode === "agent") {
    try {
      const agentResponse = await agentService.processMessage(sessionId, userMessage);
      return res.json({
        reply: agentResponse.reply,
        sources: [],
      });
    } catch (err) {
      console.error("Agent error:", err);
      return res.status(500).json({
        error: "Agent processing failed",
        reply: "Sorry, the agent failed to respond.",
      });
    }
  }

  try {
    const memory = getSessionMemory(sessionId);
    const memoryVars = await memory.loadMemoryVariables({});

    let sources = [];

    if (useRAG) {
      await loadPDF();
      sources = retrieveRelevantContent(userMessage);
    }

    const systemMessage = useRAG
      ? {
          role: "system",
          content:
            sources.length > 0
              ? `You are a very helpful assistant for Contoso Electronics. Use ONLY the following excerpts to answer:\n\n--- EMPLOYEE HANDBOOK EXCERPTS ---\n${sources.join(
                  "\n\n"
                )}\n--- END OF EXCERPTS ---`
              : `You are a helpful assistant for Contoso Electronics. The excerpts do not contain relevant information for this question. Reply politely: "I'm sorry, I don't know. The employee handbook does not contain information about that."`,
        }
      : {
          role: "system",
          content: "You are a helpful and knowledgeable assistant.",
        };

    const messages = [
      systemMessage,
      ...(memoryVars.chat_history || []),
      { role: "user", content: userMessage },
    ];

    const response = await chatModel.invoke(messages);

    await memory.saveContext(
      { input: userMessage },
      { output: response.content }
    );

    res.json({
      reply: response.content,
      sources: useRAG ? sources : [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Model call failed",
      message: err.message,
      reply: "Sorry, I encountered an error. Please try again.",
    });
  }
});

// ============================================
//                  SERVER START
// ============================================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ AI API server running on port ${PORT}`);
});
