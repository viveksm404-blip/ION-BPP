"use strict";

const mongoose = require("mongoose");

const MONGO_URI = "mongodb://ondcMongo:OndcMongo123@10.10.10.56:27017/";

mongoose.connection.on("connected", () =>
  console.log("[mongodb] connected to ION-bpp"),
);
mongoose.connection.on("error", (err) =>
  console.error("[mongodb] connection error:", err.message),
);

async function connectDB() {
  await mongoose.connect(MONGO_URI, { dbName: "ION-bpp" });
}

// Schema — stores the full raw catalog publish request as-is
const catalogPublishSchema = new mongoose.Schema(
  {
    context: { type: mongoose.Schema.Types.Mixed },
    message: { type: mongoose.Schema.Types.Mixed },
  },
  {
    strict: false, // allow any extra fields in the payload
    timestamps: true, // adds createdAt / updatedAt
    collection: "catalog_publishes",
  },
);

// type
// {
// _id:ObjectId,
// context:Object,
// message:Object, // this is simmiler as catalog.message from static/publish/publish-request.json
// createdAt:Date,
// updatedAt:Date
// }

const CatalogPublish = mongoose.model("CatalogPublish", catalogPublishSchema);

// Schema — stores confirmed orders
// { orderId: String, data: Object (full on_confirm payload) }
const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    data:    { type: mongoose.Schema.Types.Mixed, required: true },
  },
  {
    timestamps: true,
    collection: "orders",
  },
);

const Order = mongoose.model("Order", orderSchema);

module.exports = { connectDB, CatalogPublish, Order };
