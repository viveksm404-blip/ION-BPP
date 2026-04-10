"use strict";

const path = require("path");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { connectDB, CatalogPublish, Order } = require("./db");
const { handleSelect } = require("./handlers/select");
const { handleInit } = require("./handlers/init");
const { handleConfirm } = require("./handlers/confirm");

const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], allowedHeaders: "*" }));
app.options("*", cors());
app.use(express.json());

const PORT = 4001;

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
      payload = {
        ...staticData,
        context: buildContext(req.body?.context ?? {}, action),
      };
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
app.post("/select", async (req, res) => {
  console.log("\n[select] request payload:");
  console.log(JSON.stringify(req.body, null, 2));

  console.log("[select] sending ACK:", JSON.stringify(ACK));
  res.json(ACK);

  const callbackUrl = "http://localhost:8082/bpp/caller/on_select";

  let payload;
  try {
    payload = await handleSelect(req.body);
  } catch (err) {
    console.error("[select] handleSelect failed:", err.message);
    return;
  }

  await delay(2000);
  console.log("[select] firing callback →", callbackUrl);
  await sendCallback(callbackUrl, payload);
});
app.post("/init", async (req, res) => {
  console.log("\n[init] request payload:");
  console.log(JSON.stringify(req.body, null, 2));

  console.log("[init] sending ACK:", JSON.stringify(ACK));
  res.json(ACK);

  const callbackUrl = "http://localhost:8082/bpp/caller/on_init";

  let payload;
  try {
    payload = handleInit(req.body);
  } catch (err) {
    console.error("[init] handleInit failed:", err.message);
    return;
  }

  await delay(2000);
  console.log("[init] firing callback →", callbackUrl);
  await sendCallback(callbackUrl, payload);
});
app.post("/confirm", async (req, res) => {
  console.log("\n[confirm] request payload:");
  console.log(JSON.stringify(req.body, null, 2));

  console.log("[confirm] sending ACK:", JSON.stringify(ACK));
  res.json(ACK);

  const callbackUrl = "http://localhost:8082/bpp/caller/on_confirm";

  let payload;
  try {
    payload = handleConfirm(req.body);
  } catch (err) {
    console.error("[confirm] handleConfirm failed:", err.message);
    return;
  }

  // Save order to DB before firing callback
  const orderId = payload.message?.contract?.id;
  const transactionId = payload.context?.transactionId;
  try {
    await Order.create({ orderId, transactionId, data: payload, status: "CONFIRMED" });
    console.log(`[confirm] order saved orderId=${orderId}`);
  } catch (err) {
    console.error("[confirm] failed to save order:", err.message);
  }

  await delay(2000);
  console.log("[confirm] firing callback →", callbackUrl);
  await sendCallback(callbackUrl, payload);
});
//app.post("/status", makeHandler("status"));
app.post("/status", async (req, res) => {
  console.log("\n[status] request payload:");
  console.log(JSON.stringify(req.body, null, 2));

  console.log("[status] sending ACK:", JSON.stringify(ACK));
  res.json(ACK);

  const callbackUrl = "http://localhost:8082/bpp/caller/on_status";
  const context = req.body?.context ?? {};
  const transactionId = context?.transactionId;

  for (let i = 1; i <= 3; i++) {
    let payload;
    try {
      // Clear require cache so edits are picked up between restarts
      const filePath = path.join(__dirname, "static", "status", `on_status-response-${i}.json`);
      delete require.cache[require.resolve(filePath)];
      const staticData = require(filePath);
      payload = { ...staticData, context: buildContext(context, "status") };
    } catch (err) {
      console.error(`[status] failed to load on_status-response-${i}: ${err.message}`);
      break;
    }

    await delay(i === 1 ? 2000 : 5000);
    console.log(`[status] firing callback ${i}/3 → ${callbackUrl}`);
    await sendCallback(callbackUrl, payload);

    // Update order status in DB for response 2 and 3
    if (i >= 2 && transactionId) {
      const performanceStatus = payload.message?.contract?.performance?.[0]?.status?.code;
      if (performanceStatus) {
        try {
          await Order.findOneAndUpdate({ transactionId }, { status: performanceStatus });
          console.log(`[status] order transactionId=${transactionId} status updated to ${performanceStatus}`);
        } catch (err) {
          console.error(`[status] failed to update order status: ${err.message}`);
        }
      }
    }
  }
});
app.post("/track", makeHandler("track"));

// ---------------------------------------------------------------------------
// Catalog endpoints
// ---------------------------------------------------------------------------
app.post("/catalog/publish", async (req, res) => {
  console.log("\n[catalog/publish] request payload:");
  console.log(JSON.stringify(req.body, null, 2));

  // 1. Forward to fabric
  let fabricResponse;
  try {
    fabricResponse = await axios.post(
      "https://fabric.nfh.global/beckn/catalog/publish",
      req.body,
      { headers: { "Content-Type": "application/json" }, timeout: 15000 }
    );
    console.log(`[catalog/publish] fabric response status=${fabricResponse.status}`);
    console.log("[catalog/publish] fabric response body:", JSON.stringify(fabricResponse.data, null, 2));
  } catch (err) {
    const status = err.response?.status ?? 502;
    const body = err.response?.data ?? { error: err.message };
    console.error(`[catalog/publish] fabric call failed: status=${status}`, body);
    return res.status(status).json(body);
  }

  // 2. Check for ACK from fabric
  const data = fabricResponse.data;
  const ackStatus = data?.status ?? data?.message?.ack?.status;
  if (ackStatus !== "ACK") {
    console.warn("[catalog/publish] fabric returned NACK — not storing");
    return res.status(400).json(fabricResponse.data);
  }

  // 3. Store in MongoDB only on ACK
  try {
    const catalogs = req.body?.message?.catalogs ?? [];
    const items = catalogs.flatMap((c) => c.resources ?? []);
    const offers = catalogs.flatMap((c) => c.offers ?? []);

    const payload = {
      context: req.body.context,
      message: req.body.message,
      items,
      offers,
    };

    const doc = await CatalogPublish.create(payload);
    console.log(`[catalog/publish] stored document id=${doc._id}`);
    res.status(200).json({ ...fabricResponse.data, id: doc._id });
  } catch (err) {
    console.error("[catalog/publish] failed to store:", err.message);
    res
      .status(500)
      .json({ message: { ack: { status: "NACK" } }, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Order endpoints
// ---------------------------------------------------------------------------
app.get("/orders", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(),
    ]);

    res.json({
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[orders] failed to fetch:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Dashboard endpoint
// ---------------------------------------------------------------------------
app.get("/dashboard", async (req, res) => {
  try {
    const [
      productAgg,
      totalOrders,
      confirmedOrders,
      enRouteOrders,
      deliveredOrders,
    ] = await Promise.all([
      CatalogPublish.aggregate([
        { $project: { itemCount: { $size: { $ifNull: ["$items", []] } } } },
        { $group: { _id: null, total: { $sum: "$itemCount" } } },
      ]),
      Order.countDocuments(),
      Order.countDocuments({ status: "CONFIRMED" }),
      Order.countDocuments({ status: "EN_ROUTE" }),
      Order.countDocuments({ status: "DELIVERED" }),
    ]);

    const totalProducts = productAgg[0]?.total ?? 0;

    res.json({
      totalProducts,
      totalOrders,
      confirmedOrders,
      enRouteOrders,
      deliveredOrders,
    });
  } catch (err) {
    console.error("[dashboard] failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

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
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`bpp-fnb-app  : http://0.0.0.0:${PORT}`);
      console.log(
        `Endpoints    : POST /select  /init  /confirm  /status  /track  POST /catalog/publish  GET /health`,
      );
    });
  })
  .catch((err) => {
    console.error("[startup] MongoDB connection failed:", err.message);
    process.exit(1);
  });
