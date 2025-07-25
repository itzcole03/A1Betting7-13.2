// MSW server setup for Jest (Node)
import { setupServer } from "msw/node";
import { handlers } from "./msw-handlers";

export const server = setupServer(...handlers);
