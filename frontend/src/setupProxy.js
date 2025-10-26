const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/v2',
    createProxyMiddleware({
      target: 'https://content.osu.edu',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
    })
  );
};
