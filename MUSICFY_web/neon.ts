import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  auth: true,
  buckets: {
    artistas: { access: "private" },
    covers: { access: "private" },
    banners: { access: "private" },
  },
});
