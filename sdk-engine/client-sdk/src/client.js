import { AIResource } from "./resources/ai.js";
import { OneAPIError } from "./errors.js";

export class OneAPI {
  constructor({
    apiKey,
    projectId,
    baseURL = "http://localhost:5000/api/v1",
    timeout = 30000
  } = {}) {
    if (!apiKey) {
      throw new Error("OneAPI apiKey is required");
    }

    if (!projectId) {
      throw new Error("OneAPI projectId is required");
    }

    this.apiKey = apiKey;
    this.projectId = projectId;
    this.baseURL = baseURL.replace(/\/+$/, "");
    this.timeout = timeout;

    this.ai = new AIResource(this);
  }

  async request(path, { method = "POST", body, headers = {} } = {}) {
    const controller = new AbortController();

    const timeoutId = setTimeout(
      () => controller.abort(),
      this.timeout
    );

    try {
      const response = await fetch(`${this.baseURL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "X-OneAPI-Project-ID": this.projectId,
          "Content-Type": "application/json",
          ...headers
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new OneAPIError(
          data.message || "OneAPI request failed",
          {
            statusCode: response.status,
            code: data.code,
            requestId: data.requestId,
            provider: data.provider
          }
        );
      }

      return data;
    } catch (error) {
      if (error instanceof OneAPIError) {
        throw error;
      }

      if (error.name === "AbortError") {
        throw new OneAPIError("OneAPI request timed out", {
          code: "REQUEST_TIMEOUT"
        });
      }

      throw new OneAPIError(error.message || "Network request failed", {
        code: "NETWORK_ERROR"
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
