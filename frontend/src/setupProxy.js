const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy API requests to Flask backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('[Proxy] Forwarding:', req.method, req.url, '→', 'http://localhost:5000' + req.url);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('[Proxy] Response:', proxyRes.statusCode, 'from', req.url);
      },
      onError: (err, req, res) => {
        console.error('[Proxy] Error:', err.message, 'for', req.url);
      }
    })
  );

  // Proxy OSU content API requests
  app.use(
    '/v2',
    createProxyMiddleware({
      target: 'https://content.osu.edu',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('Accept', 'application/json');
      },
    })
  );
};
