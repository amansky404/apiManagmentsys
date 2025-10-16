const rateStore = new Map();
const WINDOW_SIZE_MS = 60 * 1000;
const MAX_REQUESTS = 3;
const MAX_WARNINGS = 3;

function createOrLoadRecord(ip, currentTime) {
  if (!rateStore.has(ip)) {
    rateStore.set(ip, {
      count: 0,
      firstRequestTime: currentTime,
      lastRequestTime: currentTime,
      warnings: 0,
      lastWarningTime: null,
      blocked: false,
      blockedAt: null
    });
  }

  return rateStore.get(ip);
}

function buildStatus(record, currentTime) {
  const windowElapsed = currentTime - record.firstRequestTime;
  const windowResetMs = Math.max(0, WINDOW_SIZE_MS - windowElapsed);
  const remainingRequests = Math.max(0, MAX_REQUESTS - record.count);
  const retryAfterMs = record.count >= MAX_REQUESTS ? windowResetMs : 0;

  return {
    requestsInWindow: record.count,
    warnings: record.warnings,
    blocked: record.blocked,
    blockedAt: record.blockedAt,
    lastWarningTime: record.lastWarningTime,
    windowResetMs,
    remainingRequests,
    retryAfterMs
  };
}

function rateLimiter(req, res, next) {
  const ip = req.ip;
  const currentTime = Date.now();
  const record = createOrLoadRecord(ip, currentTime);

  if (record.blocked) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'IP blocked due to repeated rate limit violations.',
      rateLimit: buildStatus(record, currentTime)
    });
  }

  if (currentTime - record.firstRequestTime > WINDOW_SIZE_MS) {
    record.count = 0;
    record.firstRequestTime = currentTime;
  }

  record.count += 1;
  record.lastRequestTime = currentTime;

  if (record.count > MAX_REQUESTS) {
    record.warnings += 1;
    record.count = MAX_REQUESTS;
    record.lastWarningTime = currentTime;

    if (record.warnings > MAX_WARNINGS) {
      record.blocked = true;
      record.blockedAt = currentTime;
      rateStore.set(ip, record);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'IP blocked after multiple rate limit violations.',
        rateLimit: buildStatus(record, currentTime)
      });
    }

    rateStore.set(ip, record);
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Warning ${record.warnings} of ${MAX_WARNINGS}.`,
      rateLimit: buildStatus(record, currentTime)
    });
  }

  rateStore.set(ip, record);
  next();
}

function getRateStatus(ip) {
  const currentTime = Date.now();
  const record = rateStore.get(ip);

  if (!record) {
    return {
      requestsInWindow: 0,
      warnings: 0,
      blocked: false,
      blockedAt: null,
      lastWarningTime: null,
      windowResetMs: WINDOW_SIZE_MS,
      remainingRequests: MAX_REQUESTS,
      retryAfterMs: 0
    };
  }

  return buildStatus(record, currentTime);
}

function getRateConfig() {
  return {
    windowMs: WINDOW_SIZE_MS,
    maxRequests: MAX_REQUESTS,
    maxWarnings: MAX_WARNINGS
  };
}

module.exports = { rateLimiter, getRateStatus, getRateConfig };
