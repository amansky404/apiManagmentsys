const rateStore = new Map();
const WINDOW_SIZE_MS = 60 * 1000;
const MAX_REQUESTS = 3;
const MAX_WARNINGS = 3;

function rateLimiter(req, res, next) {
  const ip = req.ip;
  const currentTime = Date.now();
  const record = rateStore.get(ip) || {
    count: 0,
    firstRequestTime: currentTime,
    warnings: 0,
    blocked: false
  };

  if (record.blocked) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'IP blocked due to repeated rate limit violations.'
    });
  }

  if (currentTime - record.firstRequestTime > WINDOW_SIZE_MS) {
    record.count = 0;
    record.firstRequestTime = currentTime;
  }

  record.count += 1;

  if (record.count > MAX_REQUESTS) {
    record.warnings += 1;
    record.count = MAX_REQUESTS;

    if (record.warnings > MAX_WARNINGS) {
      record.blocked = true;
      rateStore.set(ip, record);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'IP blocked after multiple rate limit violations.'
      });
    }

    rateStore.set(ip, record);
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Warning ${record.warnings} of ${MAX_WARNINGS}.`
    });
  }

  rateStore.set(ip, record);
  next();
}

module.exports = { rateLimiter };
