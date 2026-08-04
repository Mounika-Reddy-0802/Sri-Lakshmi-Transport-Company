// Vercel serverless entry point.
//
// An Express app is itself a (req, res) handler, so exporting it is all Vercel
// needs. No app.listen() here — the platform owns the socket.
import app from "../src/app";

export default app;
