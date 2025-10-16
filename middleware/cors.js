const allowedOrigin = 'http://192.168.1.15:3000';

module.exports = {
  origin: function (origin, callback) {
    if (!origin || origin === allowedOrigin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS')); // Express will handle error response
    }
  },
  optionsSuccessStatus: 200
};
