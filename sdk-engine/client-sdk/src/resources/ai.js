import { ChatResponse } from "./chat-response.js";

export class AIResource {
  constructor(client) {
    this.client = client;
  }

  async chat({
    model = "default",
    messages,
    temperature = 0.7,
    maxTokens,
  } = {}) {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("At least one chat message is required");
    }

    const data = await this.client.request("/proxy/ai/chat", {
      method: "POST",
      body: {
        model,
        messages,
        temperature,
        ...(maxTokens !== undefined && { maxTokens }),
      },
    });

    return new ChatResponse(data);
  }
}