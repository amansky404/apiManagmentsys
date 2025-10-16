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

module.exports = {
  registerToken,
  validateToken,
  invalidateToken
};
