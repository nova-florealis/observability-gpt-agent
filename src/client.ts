import { Payments, EnvironmentName } from "@nevermined-io/payments";
import dotenv from "dotenv";

dotenv.config();

export class ObservabilityGPTClient {
  private subscriberPayments: Payments;
  private accessToken: string | null = null;
  private baseUrl: string;

  constructor() {
    // Create a Payments instance for client operations (getting access tokens)
    this.subscriberPayments = Payments.getInstance({
      nvmApiKey: process.env.SUBSCRIBER_NVM_API_KEY!,
      environment: process.env.NVM_ENVIRONMENT as EnvironmentName,
    });

    this.baseUrl = process.env.AGENT_URL || "http://localhost:3000";
    console.log("ObservabilityGPTClient initialized");
  }

  async initialize(): Promise<string> {
    // Get access token for demo operations using SUBSCRIBER_NVM_API_KEY
    const planId = process.env.NVM_PLAN_DID!;
    const agentId = process.env.NVM_AGENT_DID!;

    const creds = await this.subscriberPayments.agents.getAgentAccessToken(planId, agentId);
    this.accessToken = creds.accessToken;

    console.log("Access token obtained for agent operations");
    return this.accessToken;
  }

  private async makeRequest(endpoint: string, prompt: string, credit_amount: number): Promise<any> {
    if (!this.accessToken) {
      throw new Error("Client not initialized. Call initialize() first.");
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({ prompt, credit_amount }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Request failed: ${response.status} ${response.statusText} ${errorText}`);
    }

    const data = await response.json();
    return data.result;
  }

  async callGPT(prompt: string, credit_amount: number): Promise<string> {
    return await this.makeRequest("/gpt", prompt, credit_amount);
  }

  async simulateSongGeneration(prompt: string, credit_amount: number): Promise<any> {
    return await this.makeRequest("/song", prompt, credit_amount);
  }

  async simulateImageGeneration(prompt: string, credit_amount: number): Promise<any> {
    return await this.makeRequest("/image", prompt, credit_amount);
  }

  async simulateVideoGeneration(prompt: string, credit_amount: number): Promise<any> {
    return await this.makeRequest("/video", prompt, credit_amount);
  }

  async simulateCombinedGeneration(prompt: string, credit_amount: number): Promise<any> {
    return await this.makeRequest("/combined", prompt, credit_amount);
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
      { prompt: "A music video about ontologies for a teenager", credit_amount: 3 },
    ];

    console.log("\n=== Running Test Prompts ===\n");

    // Test GPT calls
    for (const { prompt, credit_amount } of textPrompts) {
      try {
        const result = await this.callGPT(prompt, credit_amount);
        console.log(`GPT Result: ${result}`);
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
    const client = new ObservabilityGPTClient();
    await client.initialize();
    await client.runTestPrompts();

    console.log("\n=== Client completed successfully ===");
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}