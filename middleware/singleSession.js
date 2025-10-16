const sessionStore = new Map();

function registerToken(ip, token) {
  sessionStore.set(ip, { token, issuedAt: Date.now() });
}

function validateToken(ip, token) {
  const entry = sessionStore.get(ip);
  if (!entry) {
    return false;
  }
  return entry.token === token;
}

function invalidateToken(ip) {
  sessionStore.delete(ip);
}

function getSessionDetails(ip) {
  const entry = sessionStore.get(ip);

  if (!entry) {
    return {
      active: false,
      issuedAt: null,
      tokenPreview: null,
      tokenAgeMs: 0
    };
  }

  const now = Date.now();
  const tokenPreview = entry.token ? `${entry.token.slice(0, 12)}…${entry.token.slice(-6)}` : null;

  return {
    active: true,
    issuedAt: entry.issuedAt,
    tokenPreview,
    tokenAgeMs: now - entry.issuedAt
  };
}

module.exports = {
  registerToken,
  validateToken,
  invalidateToken,
  getSessionDetails
};
