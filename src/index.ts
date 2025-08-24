import express from "express";
import {calendarEndpoint} from "./justworks.js";

export const app = express()

// Register the calendar endpoint
calendarEndpoint(app)

app.get('/healthz', (_, res) => res.send('OK'))

app.listen(3030, () => {
  console.log('Server running on http://localhost:3030');
});
