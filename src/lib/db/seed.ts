import { randomUUID } from "node:crypto";

import db from "./client";
import {
  dataConnections,
  memberships,
  organizations,
  users,
} from "./schema";
import { logger } from "../logger";
import { createPrng, randInt } from "../util/prng";

const SEED = 42;
const rng = createPrng(SEED);
const createdAt = new Date(Date.UTC(2026, 0, 1, 0, randInt(rng, 0, 59)));

const connections = [
  { providerKey: "shopify", displayName: "Shopify Store" },
  { providerKey: "meta", displayName: "Meta Ads" },
  { providerKey: "google-ads", displayName: "Google Ads" },
  { providerKey: "klaviyo", displayName: "Klaviyo" },
  { providerKey: "gorgias", displayName: "Gorgias Support" },
] as const;

function seed(): void {
  logger.info("Starting demo database seed", { seed: SEED });

  // UUIDs are intentionally random valid row identifiers; the PRNG drives reproducible seed data.
  const organizationId = randomUUID();
  const userId = randomUUID();

  db.transaction((tx) => {
    logger.info("Clearing existing demo entities");
    tx.delete(dataConnections).run();
    tx.delete(memberships).run();
    tx.delete(users).run();
    tx.delete(organizations).run();

    tx.insert(organizations)
      .values({ id: organizationId, name: "Northbound Supply Co.", createdAt })
      .run();
    tx.insert(users)
      .values({
        id: userId,
        email: "alex.morgan@northboundsupply.example",
        name: "Alex Morgan",
        createdAt,
      })
      .run();
    tx.insert(memberships)
      .values({ id: randomUUID(), orgId: organizationId, userId, role: "owner" })
      .run();
    tx.insert(dataConnections)
      .values(
        connections.map((connection) => ({
          id: randomUUID(),
          orgId: organizationId,
          ...connection,
          isSimulated: true,
          status: "connected",
          lastSyncedAt: null,
          credentialsRef: "simulated",
        })),
      )
      .run();
  });

  logger.info("Demo database seed complete", {
    organizations: 1,
    users: 1,
    memberships: 1,
    dataConnections: connections.length,
  });
}

try {
  seed();
} catch (error) {
  logger.error("Demo database seed failed", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
}
