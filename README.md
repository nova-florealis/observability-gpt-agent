# observability-gpt-agent

A simple GPT agent that speaks through the OpenAI API, Helicone monitoring through Nevermined Observability.

## Features

- **OpenAI GPT Integration**: Uses GPT-3.5-turbo for AI responses
- **Observability**: Integrated with Nevermined via Helicone for API monitoring and analytics

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory with the following environment variables:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Helicone Observability
HELICONE_API_KEY=your_helicone_api_key_here

# Nevermined Configuration
NVM_API_KEY=your_nvm_api_key_here
NVM_ENVIRONMENT=testing  # Options: testing, staging, production
NVM_AGENT_DID=did:nv:your_agent_id  # Your agent's decentralized identifier
```

See `.env.example` for a template.

## Usage

### Development Mode
```bash
npm run dev
```

### Build TypeScript
```bash
npm run build
```

### Production Mode
```bash
npm start
```

### Run Tests
```bash
npm test
```

## How It Works

The agent:
1. Initializes with a deterministic agent ID from `NVM_AGENT_DID`
2. Generates a unique session ID for each run
3. Configures the Nevermined Payments SDK with observability
4. Wraps OpenAI API calls with Helicone monitoring
5. Runs test prompts demonstrating the agent's capabilities:
   - Writing haikus about AI
   - Explaining quantum computing
   - Answering philosophical questions

## Architecture

- **ObservabilityGPTAgent Class**: Main agent class that handles:
  - Session and agent ID management
  - OpenAI API interactions with observability
  - Test prompt execution

- **Integrations**:
  - OpenAI API for language model capabilities
  - Nevermined Observability for API call monitoring tracking through Helicone

## Requirements

- Node.js >= 18.0.0
- Valid API keys for:
  - OpenAI
  - Helicone
  - Nevermined

## Example Output

```
Agent ID: did:nv:test1234
Session ID: a1b2c3d4e5f6...

=== Running Test Prompts ===

Calling GPT with prompt: "Write a haiku about artificial intelligence"
GPT Response: "Silicon dreams wake / Algorithms learn to think / Future minds emerge"
---
...
```
