import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

import app from './app.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`SmartBrik API listening on port ${PORT}`);
});
