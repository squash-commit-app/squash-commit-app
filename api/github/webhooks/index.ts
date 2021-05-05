import { createNodeMiddleware, createProbot } from "probot";
import app from "../../../src/app";

const probot = createProbot({
  defaults: {
    webhookPath: "/api/github/webhooks",
  },
});

const func = createNodeMiddleware(app, { probot });

export default func;
