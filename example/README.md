# OneAPI & Backend Testing Suite

An interactive web application designed to test all backend endpoints of OneAPI and Authentication without relying on third-party tools like Postman.

---

## 🚀 How to Run

### Option 1: Direct File Open
Simply double-click or open `example/index.html` directly in your browser:
```text
file:///d:/hackthon/hack-vsak/example/index.html
```

### Option 2: Run with any Local Static Server
If you prefer running via HTTP:
```bash
# Using python
cd example
python -m http.server 3000

# Or using npx serve
npx serve example
```
Then visit `http://localhost:3000`.

---

## 🧪 What You Can Test

1. **System & Health**:
   - Live server ping and database status indicator.
   - Provider registry discovery (`GET /api/v1/proxy/providers`).
   - Authentication route catalog (`GET /api/v1/auth`).

2. **Complete Authentication Flow**:
   - **Signup**: Input name, phone number, email, password, and accept terms.
   - **Verify OTP**: Input the 6-digit code received in your email (or printed in the backend console during development). Automatically stores the JWT access token for subsequent requests.
   - **Resend OTP**: Request a new 6-digit code.
   - **Login**: Authenticate credentials; automatically saves JWT tokens and user details.
   - **Password Recovery**: Test `/forgot-password` and `/reset-password`.
   - **Profile & Session**: Fetch profile via `/me`, refresh access token, and logout.

3. **Developer API Keys (CRUD & AI)**:
   - **Generate Key**: Create a new `sk_live_...` key.
   - **List Keys**: View all active keys and masked previews.
   - **Update / Revoke**: Rename key, toggle active status, or delete key.
   - **AI Validation**: Test `/api/v1/auth/api-keys/validate` simulating an AI agent validating a key against `userId` and `email`.

4. **OneAPI Projects & Vault**:
   - **Create Project**: Generates a project token (`oneapi_dev_token_xxx`).
   - **Encrypted Vault**: Store third-party provider keys safely encrypted with AES-256-GCM.
   - **Routing Configuration**: Configure Primary & Fallback provider pairs.

5. **OneAPI Gateway Proxy with Automatic Failover**:
   - 🤖 **AI Chat**: Send prompts to Gemini; if Gemini fails (e.g. rate limit), automatically falls over to Groq / Pollinations AI!
   - 🎵 **Music Search**: Search tracks with Deezer ➔ iTunes failover, with audio previews.
   - ⛅ **Weather**: Real-time forecast with Open-Meteo ➔ Weatherstack failover.
   - 📰 **News**: Search articles with HackerNews ➔ Spaceflight failover.
   - 🌿 **Environment**: Air quality metrics with OpenAQ ➔ Open-Meteo Atmospheric Air failover.

6. **Live Response & Network Inspector**:
   - Real-time HTTP status codes and millisecond latency tracking.
   - Automatic detection of `X-OneAPI-Fallback` header with failover badge (`FAILOVER (primary ➔ fallback)`).
   - Formatted, copyable JSON response viewer.
