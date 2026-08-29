
import "./passport";
import "./worker";

import { app } from "./app";
import { env } from "./config/env";
import { ensureIndex } from "./services/search.service";

ensureIndex().catch(err =>
  console.error("Elasticsearch initialization failed:", err.message)
);

app.listen(env.PORT, () => {
  console.log(`Backend running at http://localhost:${env.PORT}`);
  console.log(`Bull Board at http://localhost:${env.PORT}/admin/queues`);
});

