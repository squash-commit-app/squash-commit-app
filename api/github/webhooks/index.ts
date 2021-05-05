import { createNodeMiddleware, createProbot } from "probot";

const app = require("../../../src/app");
const probot = createProbot({
  defaults: {
    webhookPath: "/api/github/webhooks",
  },
});

const func = createNodeMiddleware(app, { probot });

export default func;
