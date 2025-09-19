import { Payments, StartAgentRequest } from "@nevermined-io/payments";
import { generateDeterministicAgentId, generateSessionId } from "./utils";

/**
 * Helper function to calculate image size in pixels from width and height
 */
function calculatePixels(width: number, height: number): number {
  return width * height;
}

export async function simulateImageGeneration(
  payments: Payments,
  prompt: string,
  credit_amount: number,
  batchId?: string,
  requestAccessToken?: string
): Promise<any> {
  console.log(`\nSimulating image generation for: "${prompt}"`);

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
  
  // Create custom properties for image generation operations
  const customProperties = {
    agentid: agentId,
    sessionid: sessionId,
    // planid: process.env.NVM_PLAN_DID || 'did:nv:0000000000000000000000000000000000000000',
    // plan_type: process.env.NVM_PLAN_TYPE || 'credit_based',
    credit_amount: String(credit_amount),
    credit_usd_rate: String(0.001),
    credit_price_usd: String(0.001 * credit_amount),
    operation: 'simulated_image_generation',
    batch_id: batchId || '',
    is_batch_request: String(batchId ? 1 : 0)
  };

  const SIMULATED_IMAGE_URLS = [
    "https://v3.fal.media/files/kangaroo/OyJfXujVSXxPby1bjYe--.png",
    "https://v3.fal.media/files/rabbit/iGjlnk6hZqq5LPtOOSdiu.png",
    "https://v3.fal.media/files/lion/sGrK0XLGX-V2-LOCMN6aW.png",
    "https://v3.fal.media/files/panda/VytitIH7qWYfrXzLvITxi.png",
    "https://v3.fal.media/files/panda/XJb6IFiXFUxxWvn6tyDBl.png",
    "https://v3.fal.media/files/zebra/7sNOX9UH0mLjndayQsIYw.png",
    "https://v3.fal.media/files/lion/Y5MynHlT3LFGUf-BrD6Dd.png",
    "https://v3.fal.media/files/rabbit/EmyU04RwnZGlODQt9z9WZ.png",
    "https://v3.fal.media/files/koala/9cnEfODPJLdoKLiM2_pND.png"
  ];

  const result = await payments.observability.withHeliconeLogging(
    'ImageGeneratorAgent',
    {
      model: "fal-ai/flux-schnell/text-to-image",
      inputData: {
        prompt: prompt,
        image_size: "landscape_16_9",
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true
      }
    },
    async () => {
      // Randomly select a simulated image URL
      const url = SIMULATED_IMAGE_URLS[Math.floor(Math.random() * SIMULATED_IMAGE_URLS.length)];

      // Calculate pixels for default dimensions (1024x576)
      const pixels = calculatePixels(1024, 576);
      console.log("Generated image pixels:", pixels);

      return {
        imageUrl: url,
        pixels: pixels,
        width: 1024,
        height: 576
      };
    },
    (internalResult) => ({
      url: internalResult.imageUrl,
      width: internalResult.width,
      height: internalResult.height,
      pixels: internalResult.pixels
    }),
    (internalResult) => payments.observability.calculateImageUsage(internalResult.pixels),
    'img',
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