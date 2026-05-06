import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

const PORT = process.env.PORT || 4000;

const { default: app } = await import('./app.js');

const server = app.listen(PORT, () => {
  console.log(`SmartBrik API listening on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing backend server or set a different PORT in .env.`);
    process.exit(1);
  }
  throw err;
});
