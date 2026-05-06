import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

const PORT = process.env.PORT || 4000;

const { default: app } = await import('./app.js');

app.listen(PORT, () => {
  console.log(`SmartBrik API listening on port ${PORT}`);
});
