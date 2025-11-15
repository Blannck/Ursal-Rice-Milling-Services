import "server-only";

import { StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  projectId: process.env.STACK_PROJECT_ID!,
   baseUrl: "https://api.stack-auth.com",
});
