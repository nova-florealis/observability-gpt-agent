import { Payments, EnvironmentName, StartAgentRequest } from "@nevermined-io/payments";
import dotenv from "dotenv";
import crypto from "crypto";
import { callGPT, simulateSongGeneration, simulateImageGeneration, simulateVideoGeneration } from "./operations";

dotenv.config();

class ObservabilityGPTAgent {
  private readonly payments: Payments; // Builder payments for observability
  private subscriberPayments: Payments; // Subscriber payments for request processing
  private accessToken: string | null = null;

  constructor() {
    // Use BUILDER_NVM_API_KEY for the main agent operations (like financial-agent)
    this.payments = Payments.getInstance({
      nvmApiKey: process.env.BUILDER_NVM_API_KEY!,
      environment: process.env.NVM_ENVIRONMENT as EnvironmentName,
    });

    // Create a separate Payments instance for client operations (getting access tokens)
    this.subscriberPayments = Payments.getInstance({
      nvmApiKey: process.env.SUBSCRIBER_NVM_API_KEY!,
      environment: process.env.NVM_ENVIRONMENT as EnvironmentName,
    });

    console.log("ObservabilityGPTAgent initialized");
  }

  async initialize() {
    // Get access token for demo operations using SUBSCRIBER_NVM_API_KEY (like financial-agent client)
    const planId = process.env.NVM_PLAN_DID!;
    const agentId = process.env.NVM_AGENT_DID!;

    const creds = await this.subscriberPayments.agents.getAgentAccessToken(planId, agentId);
    this.accessToken = creds.accessToken;

    console.log("Access token obtained for agent operations");
  }

  async getAgentRequest(endpoint: string, method: string): Promise<StartAgentRequest> {
    if (!this.accessToken || !this.payments) {
      throw new Error("Agent not initialized. Call initialize() first.");
    }

    const agentId = process.env.NVM_AGENT_DID!;
    const agentHost = process.env.NVM_AGENT_HOST || 'http://localhost:3000';
    const fullUrl = `${agentHost}${endpoint}`;

    // Use payments instance to validate the access token it generated
    return await this.payments.requests.startProcessingRequest(
      agentId,
      `Bearer ${this.accessToken}`,
      fullUrl,
      method
    );
  }

  async callGPT(prompt: string, credit_amount: number): Promise<string> {
    const agentRequest = await this.getAgentRequest('/ask', 'POST');
    return await callGPT(this.payments, agentRequest, prompt, credit_amount);
  }

  async simulateSongGeneration(prompt: string, credit_amount: number): Promise<any> {
    const agentRequest = await this.getAgentRequest('/ask', 'POST');
    return await simulateSongGeneration(this.payments, agentRequest, prompt, credit_amount);
  }

  async simulateImageGeneration(prompt: string, credit_amount: number): Promise<any> {
    const agentRequest = await this.getAgentRequest('/ask', 'POST');
    return await simulateImageGeneration(this.payments, agentRequest, prompt, credit_amount);
  }

  async simulateVideoGeneration(prompt: string, credit_amount: number): Promise<any> {
    const agentRequest = await this.getAgentRequest('/ask', 'POST');
    return await simulateVideoGeneration(this.payments, agentRequest, prompt, credit_amount);
  }

  async simulateCombinedGeneration(prompt: string, credit_amount: number): Promise<any> {
    // Generate batch ID for this combined operation
    const batchId = crypto.randomUUID();

    const gptAgentRequest = await this.getAgentRequest('/ask', 'POST');
    const gptResult = await callGPT(this.payments, gptAgentRequest, prompt, credit_amount, batchId);

    const imageAgentRequest = await this.getAgentRequest('/ask', 'POST');
    const imageResult = await simulateImageGeneration(this.payments, imageAgentRequest, prompt, credit_amount, batchId);

    const songAgentRequest = await this.getAgentRequest('/ask', 'POST');
    const songResult = await simulateSongGeneration(this.payments, songAgentRequest, prompt, credit_amount, batchId);

    const videoAgentRequest = await this.getAgentRequest('/ask', 'POST');
    const videoResult = await simulateVideoGeneration(this.payments, videoAgentRequest, prompt, credit_amount, batchId);
    
    return { gptResult, imageResult, songResult, videoResult };
  }

  async runTestPrompts() {
    const textPrompts = [
      { prompt: "Write a haiku about artificial intelligence", credit_amount: 5 },
      { prompt: "Explain quantum computing in one sentence", credit_amount: 8 },
      { prompt: "What's the meaning of life in 10 words or less?", credit_amount: 12 },
    ];

    const songPrompts = [
      { prompt: "A melancholy ballad about debugging at 3am", credit_amount: 3 },
      { prompt: "Jazz fusion for coffee shop philosophers", credit_amount: 7 }
    ];

    const imagePrompts = [
      { prompt: "A wizard teaching calculus to manifolds", credit_amount: 2 },
      { prompt: "Time itself having an existential crisis", credit_amount: 4 }
    ];

    const videoPrompts = [
      { prompt: "Gravity deciding to take a day off", credit_amount: 6 },
      { prompt: "Colors arguing about who's most important", credit_amount: 9 }
    ];

    const combinedPrompts = [
      { prompt: "A music video about ontolgies for a teenager", credit_amount: 3 },
    ];

    console.log("\n=== Running Test Prompts ===\n");
    
    // Test GPT calls
    for (const { prompt, credit_amount } of textPrompts) {
      try {
        await this.callGPT(prompt, credit_amount);
        console.log("---");
      } catch (error) {
        console.error(`Failed to process prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log("\n=== Testing Simulated Song Generation ===\n");
    
    // Test simulated song generation
    for (const { prompt, credit_amount } of songPrompts) {
      try {
        const songResult = await this.simulateSongGeneration(prompt, credit_amount);
        console.log(`Song generated: ${songResult.music.title}`);
        console.log(`Audio URL: ${songResult.music.audioUrl}`);
        console.log(`Duration: ${songResult.music.duration}s`);
        console.log("---");
      } catch (error) {
        console.error(`Failed to generate song: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log("\n=== Testing Simulated Image Generation ===\n");
    
    // Test simulated image generation
    for (const { prompt, credit_amount } of imagePrompts) {
      try {
        const imageResult = await this.simulateImageGeneration(prompt, credit_amount);
        console.log(`Image generated: ${imageResult.width}x${imageResult.height}`);
        console.log(`Image URL: ${imageResult.url}`);
        console.log(`Pixels: ${imageResult.pixels}`);
        console.log("---");
      } catch (error) {
        console.error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log("\n=== Testing Simulated Video Generation ===\n");
    
    // Test simulated video generation
    for (const { prompt, credit_amount } of videoPrompts) {
      try {
        const videoResult = await this.simulateVideoGeneration(prompt, credit_amount);
        console.log(`Video generated: ${videoResult.duration}s (${videoResult.aspectRatio})`);
        console.log(`Video URL: ${videoResult.url}`);
        console.log(`Mode: ${videoResult.mode}, Version: ${videoResult.version}`);
        console.log("---");
      } catch (error) {
        console.error(`Failed to generate video: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log("\n=== Testing Combined Prompts ===\n");
    
    // Test combined prompts
    for (const { prompt, credit_amount } of combinedPrompts) {
      try {
        const combinedResult = await this.simulateCombinedGeneration(prompt, credit_amount);
        console.log(`Combined result: ${JSON.stringify(combinedResult)}`);
        console.log("---");
      } catch (error) {
        console.error(`Failed to generate combined generation: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    await agent.initialize();
    await agent.runTestPrompts();

    console.log("\n=== Agent completed successfully ===");
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

main();