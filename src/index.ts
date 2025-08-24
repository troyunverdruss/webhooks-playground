import express from "express";
import {calendarEndpoint} from "./justworks.js";

export const app = express()

// Register the calendar endpoint
calendarEndpoint(app)

app.listen(3030, () => {
  console.log('Server running on http://localhost:3030');
});
