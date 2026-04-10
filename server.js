"use strict";

const path = require("path");
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4001;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ACK = { message: { ack: { status: "ACK" } } };

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildContext(reqContext, action) {
  return {
    ...reqContext,
    action: `on_${action}`,
    timestamp: new Date().toISOString(),
  };
}

function loadStatic(action) {
  // status has multiple files — always use the first one
  const name =
    action === "status" ? "on_status-response-1" : `on_${action}-response`;
  return require(path.join(__dirname, "static", action, `${name}.json`));
}

async function sendCallback(callbackUrl, payload) {
  try {
    const resp = await axios.post(callbackUrl, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    });
    console.log(`[callback] → ${callbackUrl}  status=${resp.status}`);
  } catch (err) {
    const status = err.response?.status;
    const body = err.response?.data
      ? JSON.stringify(err.response.data).slice(0, 200)
      : err.message;
    console.error(
      `[callback] failed: url=${callbackUrl} status=${status ?? "CONN_ERR"} ${body}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Generic handler factory
// ---------------------------------------------------------------------------
function makeHandler(action) {
  return async (req, res) => {
    // 1. Log incoming payload
    console.log(`\n[${action}] request payload:`);
    console.log(JSON.stringify(req.body, null, 2));

    // 2. Send synchronous ACK and log it
    console.log(`[${action}] sending ACK:`, JSON.stringify(ACK));
    res.json(ACK);

    // 3. Build callback URL
    const callbackUrl = `http://localhost:8082/bpp/caller/on_${action}`;

    // 4. Load static response payload and inject generated context
    let payload;
    try {
      const staticData = loadStatic(action);
      payload = { ...staticData, context: buildContext(req.body?.context ?? {}, action) };
    } catch (err) {
      console.error(
        `[${action}] failed to load static payload: ${err.message}`,
      );
      return;
    }

    // 5. Wait 2 seconds, then fire callback
    await delay(2000);
    console.log(`[${action}] firing callback → ${callbackUrl}`);
    await sendCallback(callbackUrl, payload);
  };
}

// ---------------------------------------------------------------------------
// Beckn transaction endpoints
// ---------------------------------------------------------------------------
app.post("/select", makeHandler("select"));
app.post("/init", makeHandler("init"));
app.post("/confirm", makeHandler("confirm"));
app.post("/status", makeHandler("status"));
app.post("/track", makeHandler("track"));

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/health", (_req, res) =>
  res.json({
    status: "ok",
    service: "bpp-fnb-app",
    uptime: Math.floor(process.uptime()),
  }),
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`bpp-fnb-app  : http://0.0.0.0:${PORT}`);
  console.log(
    `Endpoints    : POST /select  /init  /confirm  /status  /track  GET /health`,
  );
});
