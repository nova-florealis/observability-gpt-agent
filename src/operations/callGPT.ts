import OpenAI from "openai";
import { Payments, StartAgentRequest } from "@nevermined-io/payments";
import { generateSessionId } from "./utils";

export async function callGPT(
  payments: Payments,
  prompt: string,
  credit_amount: number,
  batchId?: string,
  requestAccessToken?: string
): Promise<string> {
  try {
    console.log(`\nCalling GPT with prompt: "${prompt}"`);

    // Get agent request
    const agentId = process.env.NVM_AGENT_DID!;
    const agentHost = process.env.NVM_AGENT_HOST || 'http://localhost:3000';
    const agentEndpoint = process.env.NVM_AGENT_ENDPOINT || '/ask';
    const fullUrl = `${agentHost}${agentEndpoint}`;

    const startAgentRequest: StartAgentRequest = await payments.requests.startProcessingRequest(
      agentId,
      `Bearer ${requestAccessToken}`,
      fullUrl,
      'POST'
    );
    const sessionId = generateSessionId();
    
    // Create custom properties for GPT operations
    const customProperties = {
      agentid: agentId,
      sessionid: sessionId,
      // planid: process.env.NVM_PLAN_DID || 'did:nv:0000000000000000000000000000000000000000',
      // plan_type: process.env.NVM_PLAN_TYPE || 'credit_based',
      credit_amount: String(credit_amount),
      credit_usd_rate: String(0.001),
      credit_price_usd: String(0.001 * credit_amount),
      operation: 'gpt_completion',
      batch_id: batchId || '',
      is_batch_request: String(batchId ? 1 : 0)
    };

    // Create OpenAI client with observability using the newer API
    const openai = new OpenAI(payments.observability.withHeliconeOpenAI(
      process.env.OPENAI_API_KEY!,
      startAgentRequest,
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

    // Redeem credits after successful operation
    if (requestAccessToken) {
      try {
        const redemptionResult = await payments.requests.redeemCreditsFromRequest(
          startAgentRequest.agentRequestId,
          requestAccessToken,
          BigInt(credit_amount)
        );
        console.log(`Credits redeemed: ${credit_amount}`, redemptionResult);
      } catch (redeemErr) {
        console.error("Failed to redeem credits:", redeemErr);
      }
    }

    return response;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}