
import { AIResource } from "./resources/ai.js";
import { OneAPIError } from "./errors.js";

export class OneAPI {
  constructor({
    apiKey,
    projectId,
    baseURL = "http://localhost:5000/api/v1",
    timeout = 30000,
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

    // API resources
    this.ai = new AIResource(this);
  }

  async request(
    path,
    {
      method = "POST",
      body,
      params,
      headers = {},
    } = {}
  ) {
    const url = new URL(`${this.baseURL}${path}`);

    // Add query parameters for GET requests
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;

        if (Array.isArray(value)) {
          value.forEach((item) => {
            url.searchParams.append(key, String(item));
          });
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    }

    const controller = new AbortController();

    const timeoutId = setTimeout(
      () => controller.abort(),
      this.timeout
    );

    try {
      const requestHeaders = {
        Authorization: `Bearer ${this.apiKey}`,
        "X-OneAPI-Project-ID": this.projectId,
        Accept: "application/json",
        ...headers,
      };

      if (body !== undefined) {
        requestHeaders["Content-Type"] =
          requestHeaders["Content-Type"] || "application/json";
      }

      const response = await fetch(url.toString(), {
        method,
        headers: requestHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type") || "";

      const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      const responseData =
        data && typeof data === "object" ? data : {};

      if (!response.ok) {
        throw new OneAPIError(
          responseData.message || responseData.error?.message ||
            (typeof data === "string" && data) ||
            "OneAPI request failed",
          {
            statusCode: response.status,
            code: responseData.code,
            requestId:
              responseData.requestId ||
              response.headers.get("x-request-id"),
            provider: responseData.provider,
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
          code: "REQUEST_TIMEOUT",
        });
      }

      throw new OneAPIError(
        error.message || "Network request failed",
        {
          code: "NETWORK_ERROR",
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
