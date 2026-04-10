function generateContext(
  bapId,
  bapUri,
  bppId,
  bppUri,
  action,
  transactionId,
  messageId,
) {
  return {
    version: "2.0.0",
    action: action,
    timestamp: new Date().toISOString(),
    messageId: messageId,
    transactionId: transactionId,
    bapId: bapId,
    bapUri: bapUri,
    bppId: bppId,
    bppUri: bppUri,
    ttl: "PT10M",
    networkId: "beckn.one/testnet",
  };
}
module.exports = { generateContext };
