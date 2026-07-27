import { b as private_env } from "../../../chunks/shared-server.js";
import { json } from "@sveltejs/kit";
const prerender = false;
const GET = () => {
  return json(
    {
      app: "cushion",
      commit: private_env.RAILWAY_GIT_COMMIT_SHA ?? private_env.GIT_COMMIT_SHA ?? null
    },
    {
      headers: {
        "cache-control": "no-store, max-age=0",
        "x-robots-tag": "noindex, nofollow"
      }
    }
  );
};
export {
  GET,
  prerender
};
