import 'dotenv/config';
import { app } from './app.js';

// Load env config and start the HTTP server.
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
