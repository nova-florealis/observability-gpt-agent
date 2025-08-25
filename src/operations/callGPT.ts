import OpenAI from "openai";
import { Payments } from "@nevermined-io/payments";
import { generateDeterministicAgentId, generateSessionId } from "./utils";

export async function callGPT(
  payments: Payments,
  prompt: string,
  credit_cost: number
): Promise<string> {
  try {
    console.log(`\nCalling GPT with prompt: "${prompt}"`);
    
    const agentId = generateDeterministicAgentId();
    const sessionId = generateSessionId();
    
    // Create custom properties for GPT operations
    const customProperties = {
      agentid: agentId,
      sessionid: sessionId,
      planid: process.env.NVM_PLAN_DID || 'did:nv:0000000000000000000000000000000000000000',
      plan_type: process.env.NVM_PLAN_TYPE || 'credit_based',
      credit_cost: credit_cost,
      operation: 'gpt_completion'
    };

    // Create OpenAI client with observability
    const openai = new OpenAI(payments.observability.withHeliconeOpenAI(
      process.env.OPENAI_API_KEY!,
      customProperties
    ));
    
    const completion = await openai.chat.completions.create({
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