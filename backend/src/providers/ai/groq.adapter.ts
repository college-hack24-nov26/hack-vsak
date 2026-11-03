import type { IProviderAdapter, UnifiedAiRequest, UnifiedAiResponse, ProviderConfig } from '../types.js';

export class GroqAiAdapter implements IProviderAdapter<UnifiedAiRequest, UnifiedAiResponse> {
  public readonly id = 'groq';
  public readonly category = 'ai' as const;
  public readonly displayName = 'Groq (Llama 3.3 70B / OpenAI-Compatible)';
  public readonly isKeyRequired = true;

  public async execute(params: UnifiedAiRequest, config: ProviderConfig): Promise<UnifiedAiResponse> {
    const apiKey = config.apiKey || process.env.GROQ_API_KEY;
    const model = params.model && params.model !== 'default' ? params.model : 'llama-3.3-70b-versatile';

    if (!apiKey) {
      const err = new Error('Groq API key is required. Please add your Groq API key to the project vault or set GROQ_API_KEY.');
      (err as any).statusCode = 401;
      throw err;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 25000);

    try {
      // Authenticated Groq / OpenAI-compatible endpoint
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: params.messages,
          temperature: params.temperature ?? 0.7,
          max_tokens: params.maxTokens ?? 1024,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        const err = new Error(`Groq upstream error: ${response.status} - ${errorText}`);
        (err as any).statusCode = response.status;
        throw err;
      }

      const data = (await response.json()) as any;
      const promptTokens = data.usage?.prompt_tokens ?? 0;
      const completionTokens = data.usage?.completion_tokens ?? 0;
      const totalTokens = data.usage?.total_tokens ?? (promptTokens + completionTokens);

      return {
        id: data.id || `chatcmpl-groq-${Date.now()}`,
        object: data.object || 'chat.completion',
        created: data.created || Math.floor(Date.now() / 1000),
        choices: (data.choices || []).map((c: any) => {
          const finish = c.finish_reason || 'stop';
          return {
            index: c.index ?? 0,
            message: {
              role: c.message?.role || 'assistant',
              content: c.message?.content || '',
            },
            finishReason: finish,
            finish_reason: finish,
          };
        }),
        model: data.model || model,
        provider: this.id,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
