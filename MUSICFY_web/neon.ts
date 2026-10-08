import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  buckets: {
    artistas: { access: "private" },
    covers: { access: "private" },
    banners: { access: "private" },
  },
});
