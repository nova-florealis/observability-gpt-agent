import OpenAI from "openai";
import crypto from "crypto";
import { Payments, EnvironmentName } from "@nevermined-io/payments";
import dotenv from "dotenv";

dotenv.config();

function generateDeterministicAgentId(): string {
  return process.env.NVM_AGENT_DID!;
}

function generateSessionId(): string {
  return crypto.randomBytes(16).toString("hex");
}

class ObservabilityGPTAgent {
  private readonly agentId: string;
  private readonly sessionId: string;
  private readonly payments: Payments;
  private readonly openai: OpenAI;

  constructor() {
    this.agentId = generateDeterministicAgentId();
    this.sessionId = generateSessionId();
    
    console.log(`Agent ID: ${this.agentId}`);
    console.log(`Session ID: ${this.sessionId}`);
    
    this.payments = Payments.getInstance({
      nvmApiKey: process.env.NVM_API_KEY!,
      environment: process.env.NVM_ENVIRONMENT as EnvironmentName,
    });

    // Create custom properties for Helicone tracking
    const customProperties = {
      agentid: this.agentId,
      sessionid: this.sessionId,
      planid: process.env.NVM_PLAN_DID || 'did:nv:0000000000000000000000000000000000000000',
      plan_type: process.env.NVM_PLAN_TYPE || 'credit_based',
      credit_cost: 10
    };

    this.openai = new OpenAI(this.payments.observability.withHeliconeOpenAI(
      process.env.OPENAI_API_KEY!,
      customProperties
    ));
  }

  async callGPT(prompt: string): Promise<string> {
    try {
      console.log(`\nCalling GPT with prompt: "${prompt}"`);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a simulacrum of a mind that provides concise and creative responses.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content || "No response generated";
      console.log(`GPT Response: "${response}"`);
      
      return response;
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      throw error;
    }
  }

  async runTestPrompts() {
    const testPrompts = [
      "Write a haiku about artificial intelligence",
      "Explain quantum computing in one sentence",
      "What's the meaning of life in 10 words or less?",
    ];

    console.log("\n=== Running Test Prompts ===\n");
    
    for (const prompt of testPrompts) {
      try {
        await this.callGPT(prompt);
        console.log("---");
      } catch (error) {
        console.error(`Failed to process prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
}

async function main() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }

    const agent = new ObservabilityGPTAgent();
    await agent.runTestPrompts();
    
    console.log("\n=== Agent completed successfully ===");
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

main();