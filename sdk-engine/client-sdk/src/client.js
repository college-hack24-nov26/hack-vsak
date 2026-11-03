import { AIResource } from "./resources/ai.js";
import { WeatherResource } from "./resources/weather.js";
import { MusicResource } from "./resources/music.js";
import { NewsResource } from "./resources/news.js";
import { EnvironmentResource } from "./resources/environment.js";
import { OneAPIError } from "./errors.js";

export class OneAPI {
  constructor({
    apiKey,
    baseURL = "http://localhost:5000/api/v1",
    timeout = 30000,
  } = {}) {
    if (!apiKey) {
      throw new Error("OneAPI apiKey is required (e.g. sk_live_... or developer API key)");
    }

    this.apiKey = apiKey;
    this.baseURL = baseURL.replace(/\/+$/, "");
    this.timeout = timeout;

    this.ai = new AIResource(this);
    this.weather = new WeatherResource(this);
    this.music = new MusicResource(this);
    this.news = new NewsResource(this);
    this.environment = new EnvironmentResource(this);
  }

  async request(path, { method = "POST", body, headers = {} } = {}) {
    const controller = new AbortController();

    const timeoutId = setTimeout(
      () => controller.abort(),
      this.timeout
    );

    try {
      const requestHeaders = {
        Authorization: `Bearer ${this.apiKey}`,
        ...headers,
      };

      if (body !== undefined && !requestHeaders["Content-Type"]) {
        requestHeaders["Content-Type"] = "application/json";
      }

      const response = await fetch(`${this.baseURL}${path}`, {
        method,
        headers: requestHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new OneAPIError(
          data.error?.message || data.message || "OneAPI request failed",
          {
            statusCode: response.status,
            code: data.error?.code || data.code,
            requestId: data.requestId,
            provider: data.provider,
          }
        );
      }

      return data;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new OneAPIError("Request timed out", {
          code: "TIMEOUT",
        });
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
