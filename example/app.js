// State Management
const state = {
  baseUrl: localStorage.getItem('oneapi_base_url') || 'http://localhost:5000',
  jwtToken: localStorage.getItem('oneapi_jwt_token') || '',
  refreshToken: localStorage.getItem('oneapi_refresh_token') || '',
  userId: localStorage.getItem('oneapi_user_id') || '',
  userEmail: localStorage.getItem('oneapi_user_email') || '',
  projectId: localStorage.getItem('oneapi_project_id') || '',
  projectToken: localStorage.getItem('oneapi_project_token') || '',
  apiKey: localStorage.getItem('oneapi_api_key') || '',
};

function saveState() {
  localStorage.setItem('oneapi_base_url', state.baseUrl);
  localStorage.setItem('oneapi_jwt_token', state.jwtToken);
  localStorage.setItem('oneapi_refresh_token', state.refreshToken);
  localStorage.setItem('oneapi_user_id', state.userId);
  localStorage.setItem('oneapi_user_email', state.userEmail);
  localStorage.setItem('oneapi_project_id', state.projectId);
  localStorage.setItem('oneapi_project_token', state.projectToken);
  localStorage.setItem('oneapi_api_key', state.apiKey);
  updateStateUI();
}

function updateStateUI() {
  const tokenDisplay = document.getElementById('activeTokenDisplay');
  const projTokenDisplay = document.getElementById('activeProjTokenDisplay');

  if (state.jwtToken) {
    tokenDisplay.textContent = `Bearer ${state.jwtToken.slice(0, 16)}...`;
    tokenDisplay.style.color = 'var(--accent-green)';
  } else {
    tokenDisplay.textContent = 'None (Log in to store)';
    tokenDisplay.style.color = 'var(--text-muted)';
  }

  if (state.projectToken) {
    projTokenDisplay.textContent = `${state.projectToken.slice(0, 18)}...`;
    projTokenDisplay.style.color = 'var(--accent-blue)';
  } else {
    projTokenDisplay.textContent = 'None (Create project)';
    projTokenDisplay.style.color = 'var(--text-muted)';
  }

  // Pre-fill fields if empty
  if (state.userId && document.getElementById('aiValidateUserId')) {
    document.getElementById('aiValidateUserId').value = state.userId;
  }
  if (state.userEmail) {
    if (document.getElementById('aiValidateEmail')) document.getElementById('aiValidateEmail').value = state.userEmail;
    if (document.getElementById('loginEmail')) document.getElementById('loginEmail').value = state.userEmail;
    if (document.getElementById('verifyEmail')) document.getElementById('verifyEmail').value = state.userEmail;
    if (document.getElementById('resendEmail')) document.getElementById('resendEmail').value = state.userEmail;
    if (document.getElementById('forgotEmail')) document.getElementById('forgotEmail').value = state.userEmail;
  }
  if (state.apiKey && document.getElementById('aiValidateKey')) {
    document.getElementById('aiValidateKey').value = state.apiKey;
  }
  if (state.projectId) {
    if (document.getElementById('vaultProjectId')) document.getElementById('vaultProjectId').value = state.projectId;
    if (document.getElementById('routingProjectId')) document.getElementById('routingProjectId').value = state.projectId;
  }
}

// Tab Switching
document.querySelectorAll('.nav-item').forEach((item) => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));

    item.classList.add('active');
    const tabId = item.getAttribute('data-tab');
    const targetPane = document.getElementById(tabId);
    if (targetPane) targetPane.classList.add('active');
  });
});

// Centralized API Caller with Live Inspector
async function apiCall(endpoint, options = {}) {
  const baseUrl = document.getElementById('baseUrlInput').value.trim() || state.baseUrl;
  state.baseUrl = baseUrl;
  saveState();

  const url = `${baseUrl.replace(/\/$/, '')}${endpoint}`;
  const startTime = performance.now();

  // Determine auth header
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // If this is a proxy route, prefer Project Token
  if (endpoint.startsWith('/api/v1/proxy') && state.projectToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${state.projectToken}`;
  } else if (!headers['Authorization'] && state.jwtToken) {
    headers['Authorization'] = `Bearer ${state.jwtToken}`;
  }

  const jsonViewer = document.getElementById('jsonOutput');
  const statusElem = document.getElementById('respStatus');
  const timeElem = document.getElementById('respTime');
  const providerElem = document.getElementById('respProvider');
  const fallbackBadge = document.getElementById('respFallbackBadge');

  jsonViewer.textContent = `// Sending ${options.method || 'GET'} request to ${url}...\n// Waiting for server response...`;
  statusElem.textContent = '...';
  statusElem.className = 'stat-val';

  try {
    const fetchOptions = {
      method: options.method || 'GET',
      headers,
    };

    if (options.body && options.method !== 'GET') {
      fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    // Read headers
    const fallbackHeader = response.headers.get('X-OneAPI-Fallback');
    const finalProvider = response.headers.get('X-OneAPI-Final-Provider') || '---';
    const primaryProvider = response.headers.get('X-OneAPI-Primary-Provider');
    const fallbackReason = response.headers.get('X-OneAPI-Fallback-Reason');

    // Update Stats Display
    statusElem.textContent = `${response.status} ${response.statusText}`;
    statusElem.className = `stat-val ${response.status < 300 ? 'badge-200' : response.status < 500 ? 'badge-400' : 'badge-500'}`;
    timeElem.textContent = `${duration} ms`;
    providerElem.textContent = finalProvider;

    if (fallbackHeader === 'true') {
      fallbackBadge.style.display = 'inline-block';
      fallbackBadge.textContent = `FAILOVER (${primaryProvider} ➔ ${finalProvider}${fallbackReason ? ': ' + fallbackReason : ''})`;
    } else {
      fallbackBadge.style.display = 'none';
    }

    const contentType = response.headers.get('content-type') || '';
    let responseData;
    if (contentType.includes('application/json')) {
      responseData = await response.json();
      jsonViewer.textContent = JSON.stringify(responseData, null, 2);
    } else {
      const text = await response.text();
      jsonViewer.textContent = text;
    }

    return { ok: response.ok, status: response.status, data: responseData };
  } catch (err) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    statusElem.textContent = 'ERROR';
    statusElem.className = 'stat-val badge-500';
    timeElem.textContent = `${duration} ms`;
    providerElem.textContent = 'Failed';
    fallbackBadge.style.display = 'none';

    jsonViewer.textContent = JSON.stringify(
      {
        error: 'Network or Connection Error',
        message: err.message,
        tip: 'Ensure your backend server is running (cd backend && pnpm dev).',
      },
      null,
      2
    );

    return { ok: false, error: err };
  }
}

// 1. Health & Server Ping
async function checkServerHealth() {
  const badge = document.getElementById('serverStatusBadge');
  const text = document.getElementById('serverStatusText');

  badge.className = 'status-indicator';
  text.textContent = 'Checking...';

  const res = await apiCall('/health');
  if (res && res.status === 200) {
    badge.className = 'status-indicator online';
    text.textContent = 'Server Online (DB Connected)';
  } else if (res && res.status === 503) {
    badge.className = 'status-indicator';
    badge.style.color = 'var(--accent-amber)';
    badge.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
    badge.style.borderColor = 'rgba(245, 158, 11, 0.3)';
    text.textContent = 'Online (DB Disconnected)';
  } else {
    badge.className = 'status-indicator';
    text.textContent = 'Offline (Check backend)';
  }
}

document.getElementById('pingBtn').addEventListener('click', checkServerHealth);
document.getElementById('checkHealthBtn').addEventListener('click', () => apiCall('/health'));
document.getElementById('fetchProvidersBtn').addEventListener('click', () => apiCall('/api/v1/proxy/providers'));
document.getElementById('fetchAuthCatalogBtn').addEventListener('click', () => apiCall('/api/v1/auth'));

// 2. User Signup
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('signupName').value;
  const phone_no = document.getElementById('signupPhone').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const terms_accepted = document.getElementById('signupTerms').checked;

  const res = await apiCall('/api/v1/auth/signup', {
    method: 'POST',
    body: { name, phone_no, email, password, terms_accepted },
  });

  if (res.ok && res.data?.data) {
    state.userEmail = email;
    state.userId = res.data.data.user_id || res.data.data.userId;
    saveState();
  }
});

// 3. Verify OTP
document.getElementById('verifyOtpForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('verifyEmail').value;
  const otp = document.getElementById('verifyOtpCode').value;

  const res = await apiCall('/api/v1/auth/verify-otp', {
    method: 'POST',
    body: { email, otp },
  });

  if (res.ok && res.data?.data?.tokens) {
    state.jwtToken = res.data.data.tokens.accessToken;
    state.refreshToken = res.data.data.tokens.refreshToken;
    state.userId = res.data.data.user?.user_id || state.userId;
    state.userEmail = email;
    saveState();
  }
});

// Resend OTP
document.getElementById('resendOtpForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('resendEmail').value;
  await apiCall('/api/v1/auth/resend-otp', {
    method: 'POST',
    body: { email },
  });
});

// 4. User Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const res = await apiCall('/api/v1/auth/login', {
    method: 'POST',
    body: { email, password },
  });

  if (res.ok && res.data?.data?.tokens) {
    state.jwtToken = res.data.data.tokens.accessToken;
    state.refreshToken = res.data.data.tokens.refreshToken;
    state.userId = res.data.data.user?.user_id || state.userId;
    state.userEmail = email;
    saveState();
  }
});

// 5. Password Recovery
document.getElementById('forgotPassForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value;
  await apiCall('/api/v1/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
});

document.getElementById('resetPassForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('resetEmail').value;
  const otp = document.getElementById('resetOtpCode').value;
  const newPassword = document.getElementById('resetNewPass').value;

  await apiCall('/api/v1/auth/reset-password', {
    method: 'POST',
    body: { email, otp, newPassword },
  });
});

// 6. Profile & Session
document.getElementById('getMeBtn').addEventListener('click', async () => {
  const res = await apiCall('/api/v1/auth/me');
  if (res.ok && res.data?.data?.user) {
    state.userId = res.data.data.user.user_id || res.data.data.user._id;
    state.userEmail = res.data.data.user.email;
    saveState();
  }
});

document.getElementById('refreshTokenBtn').addEventListener('click', async () => {
  const res = await apiCall('/api/v1/auth/refresh-token', {
    method: 'POST',
    body: { refreshToken: state.refreshToken },
  });
  if (res.ok && res.data?.data?.accessToken) {
    state.jwtToken = res.data.data.accessToken;
    saveState();
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await apiCall('/api/v1/auth/logout', { method: 'POST' });
  state.jwtToken = '';
  state.refreshToken = '';
  saveState();
});

// 7. API Keys CRUD
document.getElementById('createApiKeyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('apiKeyName').value;
  const days = document.getElementById('apiKeyDays').value;

  const res = await apiCall('/api/v1/auth/create-api-key', {
    method: 'POST',
    body: {
      name,
      ...(days && { expiresInDays: parseInt(days, 10) }),
    },
  });

  if (res.ok && res.data?.data?.apiKey) {
    state.apiKey = res.data.data.apiKey;
    saveState();
  }
});

document.getElementById('listApiKeysBtn').addEventListener('click', () => apiCall('/api/v1/auth/api-keys'));

document.getElementById('updateKeyBtn').addEventListener('click', async () => {
  const keyId = document.getElementById('manageKeyId').value.trim();
  const newName = document.getElementById('manageKeyNewName').value.trim();
  if (!keyId) return alert('Please enter Key ID');

  await apiCall(`/api/v1/auth/api-keys/${keyId}`, {
    method: 'PATCH',
    body: { ...(newName && { name: newName }) },
  });
});

document.getElementById('revokeKeyBtn').addEventListener('click', async () => {
  const keyId = document.getElementById('manageKeyId').value.trim();
  if (!keyId) return alert('Please enter Key ID');

  await apiCall(`/api/v1/auth/api-keys/${keyId}`, {
    method: 'DELETE',
  });
});

// 8. AI Key Validation
document.getElementById('validateApiKeyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const apiKey = document.getElementById('aiValidateKey').value.trim();
  const userId = document.getElementById('aiValidateUserId').value.trim();
  const email = document.getElementById('aiValidateEmail').value.trim();

  await apiCall('/api/v1/auth/api-keys/validate', {
    method: 'POST',
    body: { apiKey, userId, email },
  });
});

// 9. Projects & Vault
document.getElementById('createProjectForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('projectName').value;

  const res = await apiCall('/api/v1/projects', {
    method: 'POST',
    body: { name },
  });

  if (res.ok && res.data?.data) {
    state.projectId = res.data.data.project.projectId || res.data.data.project._id;
    state.projectToken = res.data.data.projectToken;
    saveState();
  }
});

document.getElementById('storeVaultSecretForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const projectId = document.getElementById('vaultProjectId').value.trim();
  const category = document.getElementById('vaultCategory').value;
  const providerId = document.getElementById('vaultProviderId').value.trim();
  const apiKey = document.getElementById('vaultApiKey').value.trim();

  await apiCall(`/api/v1/projects/${projectId}/vault`, {
    method: 'POST',
    body: { category, providerId, apiKey },
  });
});

document.getElementById('routingConfigForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const projectId = document.getElementById('routingProjectId').value.trim();
  const category = document.getElementById('routingCategory').value;
  const primaryProviderId = document.getElementById('routingPrimary').value.trim();
  const fallbackProviderId = document.getElementById('routingFallback').value.trim();

  await apiCall(`/api/v1/projects/${projectId}/routing`, {
    method: 'PUT',
    body: { category, primaryProviderId, fallbackProviderId },
  });
});

// 10. AI Chat Proxy
document.getElementById('proxyAiForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const model = document.getElementById('aiModel').value.trim();
  const prompt = document.getElementById('aiPrompt').value.trim();

  await apiCall('/api/v1/proxy/ai/chat', {
    method: 'POST',
    body: {
      model,
      messages: [{ role: 'user', content: prompt }],
    },
  });
});

// 11. Music Proxy
document.getElementById('proxyMusicForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = encodeURIComponent(document.getElementById('musicQuery').value.trim());
  const limit = document.getElementById('musicLimit').value;

  const res = await apiCall(`/api/v1/proxy/music/search?query=${query}&limit=${limit}`);

  const container = document.getElementById('musicResultsContainer');
  container.innerHTML = '';

  if (res.ok && res.data?.data?.tracks && Array.isArray(res.data.data.tracks)) {
    res.data.data.tracks.slice(0, 3).forEach((track) => {
      const card = document.createElement('div');
      card.className = 'media-card';
      card.innerHTML = `
        ${track.coverUrl ? `<img src="${track.coverUrl}" class="media-cover" alt="Cover">` : '<div class="media-cover"></div>'}
        <div class="media-info">
          <div class="media-title">${track.title}</div>
          <div class="media-artist">${track.artist} &bull; ${track.album} (${track.duration}s)</div>
          ${track.previewUrl ? `<audio controls class="audio-preview" src="${track.previewUrl}"></audio>` : ''}
        </div>
      `;
      container.appendChild(card);
    });
  }
});

// 12. Weather Proxy
document.getElementById('proxyWeatherForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = encodeURIComponent(document.getElementById('weatherCity').value.trim());
  await apiCall(`/api/v1/proxy/weather/current?city=${city}`);
});

// 13. News Proxy
document.getElementById('proxyNewsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = encodeURIComponent(document.getElementById('newsQuery').value.trim());
  const limit = document.getElementById('newsLimit').value;
  await apiCall(`/api/v1/proxy/news/search?query=${query}&limit=${limit}`);
});

// 14. Environment Proxy
document.getElementById('proxyEnvForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = encodeURIComponent(document.getElementById('envCity').value.trim());
  await apiCall(`/api/v1/proxy/environment/air-quality?city=${city}`);
});

// Inspector Actions
document.getElementById('clearInspectorBtn').addEventListener('click', () => {
  document.getElementById('jsonOutput').textContent = '// Ready for next request...';
  document.getElementById('respStatus').textContent = '---';
  document.getElementById('respStatus').className = 'stat-val';
  document.getElementById('respTime').textContent = '0 ms';
  document.getElementById('respProvider').textContent = '---';
  document.getElementById('respFallbackBadge').style.display = 'none';
});

document.getElementById('copyJsonBtn').addEventListener('click', () => {
  const text = document.getElementById('jsonOutput').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copyJsonBtn');
    const old = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => (btn.textContent = old), 1500);
  });
});

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('baseUrlInput').value = state.baseUrl;
  updateStateUI();
  checkServerHealth();
});
