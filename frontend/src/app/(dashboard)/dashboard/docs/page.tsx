'use client';

import React from 'react';
import {
  BookOpen,
  Terminal,
  Code2,
  ShieldCheck,
  Zap,
  Sparkles,
} from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-sky-400" />
          OneAPI Gateway Developer Reference & Unified SDK
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Interact with unified endpoints and the official <code className="text-sky-400">@oneapi/sdk</code>. The OneAPI Gateway abstracts vendor specifics and automatically fails over if a provider times out or returns 429/5xx errors.
        </p>
      </div>

      {/* Unified SDK Section */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            Official OneAPI Client SDK (<code className="text-emerald-400">@oneapi/sdk</code>)
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            PRD §3.1 Compliant &bull; Unified Auth
          </span>
        </div>

        <div className="space-y-4">
          {/* SDK Installation & Init */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-300">1. Installation & Initialization</span>
            <pre className="p-3 bg-slate-900 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto">
{`// Install official package
npm install @oneapi/sdk

// Initialize OneAPI SDK in your application (Only ONE key required)
import { OneAPI } from '@oneapi/sdk';

const oneapi = new OneAPI({
  apiKey: process.env.ONEAPI_API_KEY // 'sk_live_...' from Dashboard > API Keys
});`}
            </pre>
          </div>

          {/* SDK Multi-Domain Usage */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-300">2. Multi-Domain SDK Usage (AI, Weather, Music, News, Air Quality)</span>
            <pre className="p-3 bg-slate-900 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto">
{`// 1. AI Chat Completion (Gemini -> Groq -> OpenRouter Failover)
const chat = await oneapi.ai.chat({
  messages: [{ role: 'user', content: 'Explain quantum computing in two sentences.' }],
  temperature: 0.7
});
console.log(chat.choices[0].message.content);

// 2. AI File Upload (PRD §3.1)
const upload = await oneapi.ai.upload_file({
  file: 'Base64ContentOrBuffer',
  purpose: 'assistants',
  filename: 'specs.pdf'
});
console.log('File ID:', upload.fileId);

// 3. Current Weather (Open-Meteo -> Weatherstack Failover)
const weather = await oneapi.weather.current({ city: 'Tokyo' });

// 4. Music Search (Deezer -> Apple iTunes Failover)
const music = await oneapi.music.search({ query: 'Daft Punk', limit: 5 });

// 5. News Search (HackerNews -> Spaceflight Failover)
const news = await oneapi.news.search({ query: 'artificial intelligence', limit: 5 });

// 6. Air Quality (OpenAQ -> Open-Meteo Atmospheric Failover)
const air = await oneapi.environment.airQuality({ city: 'London' });`}
            </pre>
          </div>
        </div>
      </div>

      {/* cURL Endpoints Card */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Code2 className="w-4 h-4 text-violet-400" />
          REST API & cURL Proxy Endpoints (Single Unified Auth)
        </h3>
        <p className="text-xs text-slate-400">
          All endpoints accept either <code className="text-sky-300 font-mono">Authorization: Bearer &lt;YOUR_API_KEY&gt;</code> or <code className="text-sky-300 font-mono">x-api-key: &lt;YOUR_API_KEY&gt;</code>. No projectId or projectToken needed!
        </p>

        <div className="space-y-4">
          {/* AI Chat */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 font-bold">POST</span>
              <span className="text-slate-300">http://localhost:5000/api/v1/proxy/ai/chat</span>
            </div>
            <pre className="p-3 bg-slate-900 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto">
{`curl -X POST http://localhost:5000/api/v1/proxy/ai/chat \\
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \\
  -d '{"prompt": "Summarize architecture benefits of OneAPI gateway in 2 bullets"}'`}
            </pre>
          </div>

          {/* AI File Upload */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 font-bold">POST</span>
              <span className="text-slate-300">http://localhost:5000/api/v1/proxy/ai/upload</span>
            </div>
            <pre className="p-3 bg-slate-900 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto">
{`curl -X POST http://localhost:5000/api/v1/proxy/ai/upload \\
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \\
  -d '{"purpose": "assistants", "filename": "whitepaper.pdf", "file": "base64..."}'`}
            </pre>
          </div>

          {/* Weather */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-bold">GET</span>
              <span className="text-slate-300">http://localhost:5000/api/v1/proxy/weather/current?city=Tokyo</span>
            </div>
            <pre className="p-3 bg-slate-900 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto">
{`curl http://localhost:5000/api/v1/proxy/weather/current?city=Tokyo \\
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"`}
            </pre>
          </div>

          {/* Music */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 font-bold">GET</span>
              <span className="text-slate-300">http://localhost:5000/api/v1/proxy/music/search?q=Daft+Punk</span>
            </div>
            <pre className="p-3 bg-slate-900 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto">
{`curl http://localhost:5000/api/v1/proxy/music/search?q=Daft+Punk \\
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"`}
            </pre>
          </div>

          {/* News */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">GET</span>
              <span className="text-slate-300">http://localhost:5000/api/v1/proxy/news/search?query=AI</span>
            </div>
            <pre className="p-3 bg-slate-900 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto">
{`curl "http://localhost:5000/api/v1/proxy/news/search?query=AI" \\
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"`}
            </pre>
          </div>

          {/* Environment */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">GET</span>
              <span className="text-slate-300">http://localhost:5000/api/v1/proxy/environment/air-quality?city=London</span>
            </div>
            <pre className="p-3 bg-slate-900 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto">
{`curl "http://localhost:5000/api/v1/proxy/environment/air-quality?city=London" \\
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
