import server from "../src/server";

export const config = {
  runtime: "edge",
};

export default function handler(request: Request) {
  // TanStack Start server expects a Fetch API Request.
  return server.fetch(request, {}, {});
}

