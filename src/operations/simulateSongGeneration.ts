import { Payments, StartAgentRequest } from "@nevermined-io/payments";
import { generateDeterministicAgentId, generateSessionId } from "./utils";

export async function simulateSongGeneration(
  payments: Payments,
  prompt: string,
  credit_amount: number,
  batchId?: string,
  requestAccessToken?: string
): Promise<any> {
  console.log(`\nSimulating song generation for: "${prompt}"`);

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
  
  // Create custom properties for song generation operations
  const customProperties = {
    agentid: agentId,
    sessionid: sessionId,
    // planid: process.env.NVM_PLAN_DID || 'did:nv:0000000000000000000000000000000000000000',
    // plan_type: process.env.NVM_PLAN_TYPE || 'credit_based',
    credit_amount: String(credit_amount),
    credit_usd_rate: String(0.001),
    credit_price_usd: String(0.001 * credit_amount),
    operation: 'simulated_song_generation',
    batch_id: batchId || '',
    is_batch_request: String(batchId ? 1 : 0)
  };

  // Generate simulated song data first to match original pattern
  const jobId = `simulated-job-${Math.floor(Math.random() * 1000000)}`;
  const mv = "chirp-v4"; // Default value from original
  const storedRequestData = { 
    prompt, 
    options: {
      title: "AI Generated Song",
      tags: ["ai-generated", "simulated"],
      lyrics: "This is a simulated song for testing purposes"
    }, 
    mv 
  };

  const result = await payments.observability.withHeliconeLogging(
    'SunoClient',
    {
      model: `ttapi/suno/${mv}`, // Use template literal like original
      inputData: {
        jobId: jobId,
        operation: "fetch_song",
        requestData: storedRequestData
      }
    },
    async () => {
      return {
        songResponse: {
          jobId,
          music: {
            musicId: `music-${jobId}`,
            title: "AI Generated Simulated Song",
            audioUrl: "https://download.samplelib.com/wav/sample-15s.wav",
            duration: 15,
          },
        },
        quota: 6
      };
    },
    (internalResult) => internalResult.songResponse,
    (internalResult) => payments.observability.calculateSongUsage(internalResult.quota),
    'song',
    startAgentRequest,
    customProperties
  );

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

  return result;
}