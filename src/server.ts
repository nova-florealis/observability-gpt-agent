import express, { Request, Response } from "express";
import { Payments, EnvironmentName } from "@nevermined-io/payments";
import dotenv from "dotenv";
import crypto from "crypto";
import { callGPT, simulateSongGeneration, simulateImageGeneration, simulateVideoGeneration } from "./operations";

dotenv.config();

class ObservabilityGPTServer {
  private readonly payments: Payments; // Builder payments for observability

  constructor() {
    // Use BUILDER_NVM_API_KEY for the main agent operations
    this.payments = Payments.getInstance({
      nvmApiKey: process.env.BUILDER_NVM_API_KEY!,
      environment: process.env.NVM_ENVIRONMENT as EnvironmentName,
    });

    console.log("ObservabilityGPTServer initialized");
  }

  async callGPT(prompt: string, credit_amount: number, accessToken: string): Promise<string> {
    return await callGPT(this.payments, prompt, credit_amount, undefined, accessToken);
  }

  async simulateSongGeneration(prompt: string, credit_amount: number, accessToken: string): Promise<any> {
    return await simulateSongGeneration(this.payments, prompt, credit_amount, undefined, accessToken);
  }

  async simulateImageGeneration(prompt: string, credit_amount: number, accessToken: string): Promise<any> {
    return await simulateImageGeneration(this.payments, prompt, credit_amount, undefined, accessToken);
  }

  async simulateVideoGeneration(prompt: string, credit_amount: number, accessToken: string): Promise<any> {
    return await simulateVideoGeneration(this.payments, prompt, credit_amount, undefined, accessToken);
  }

  async simulateCombinedGeneration(prompt: string, credit_amount: number, accessToken: string): Promise<any> {
    // Generate batch ID for this combined operation
    const batchId = crypto.randomUUID();

    const gptResult = await callGPT(this.payments, prompt, credit_amount, batchId, accessToken);

    const imageResult = await simulateImageGeneration(this.payments, prompt, credit_amount, batchId, accessToken);

    const songResult = await simulateSongGeneration(this.payments, prompt, credit_amount, batchId, accessToken);

    const videoResult = await simulateVideoGeneration(this.payments, prompt, credit_amount, batchId, accessToken);

    return { gptResult, imageResult, songResult, videoResult };
  }

}

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
if (!OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is required to run the server.");
  process.exit(1);
}

const server = new ObservabilityGPTServer();

// Extract bearer token from Authorization header
function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

app.post("/gpt", async (req: Request, res: Response) => {
  try {
    const { prompt, credit_amount } = req.body;
    const accessToken = extractBearerToken(req);

    if (!prompt || !credit_amount) {
      return res.status(400).json({ error: "Missing prompt or credit_amount" });
    }

    if (!accessToken) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const result = await server.callGPT(prompt, credit_amount, accessToken);
    res.json({ result });
  } catch (error: any) {
    console.error("GPT endpoint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/song", async (req: Request, res: Response) => {
  try {
    const { prompt, credit_amount } = req.body;
    const accessToken = extractBearerToken(req);

    if (!prompt || !credit_amount) {
      return res.status(400).json({ error: "Missing prompt or credit_amount" });
    }

    if (!accessToken) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const result = await server.simulateSongGeneration(prompt, credit_amount, accessToken);
    res.json({ result });
  } catch (error: any) {
    console.error("Song endpoint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/image", async (req: Request, res: Response) => {
  try {
    const { prompt, credit_amount } = req.body;
    const accessToken = extractBearerToken(req);

    if (!prompt || !credit_amount) {
      return res.status(400).json({ error: "Missing prompt or credit_amount" });
    }

    if (!accessToken) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const result = await server.simulateImageGeneration(prompt, credit_amount, accessToken);
    res.json({ result });
  } catch (error: any) {
    console.error("Image endpoint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/video", async (req: Request, res: Response) => {
  try {
    const { prompt, credit_amount } = req.body;
    const accessToken = extractBearerToken(req);

    if (!prompt || !credit_amount) {
      return res.status(400).json({ error: "Missing prompt or credit_amount" });
    }

    if (!accessToken) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const result = await server.simulateVideoGeneration(prompt, credit_amount, accessToken);
    res.json({ result });
  } catch (error: any) {
    console.error("Video endpoint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/combined", async (req: Request, res: Response) => {
  try {
    const { prompt, credit_amount } = req.body;
    const accessToken = extractBearerToken(req);

    if (!prompt || !credit_amount) {
      return res.status(400).json({ error: "Missing prompt or credit_amount" });
    }

    if (!accessToken) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const result = await server.simulateCombinedGeneration(prompt, credit_amount, accessToken);
    res.json({ result });
  } catch (error: any) {
    console.error("Combined endpoint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`ObservabilityGPTServer listening on http://localhost:${PORT}`);
});