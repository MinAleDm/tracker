import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RedisService } from "../src/common/redis/redis.service";

function createFailingClient() {
  return {
    connect: async () => undefined,
    get: async () => {
      throw new Error("redis unavailable");
    },
    set: async () => {
      throw new Error("redis unavailable");
    },
    scan: async () => {
      throw new Error("redis unavailable");
    },
    del: async () => 0,
    quit: async () => undefined,
  };
}

describe("redis service", () => {
  it("falls back cleanly when redis operations fail", async () => {
    const service = new RedisService(createFailingClient());

    await assert.doesNotReject(() => service.set("tasks:1", { ok: true }, 30));
    await assert.doesNotReject(() => service.deleteByPrefix("tasks:"));

    await assert.doesNotReject(async () => {
      const value = await service.get("tasks:1");
      assert.equal(value, null);
    });
  });

  it("invalidates keys by prefix through scan batches", async () => {
    const deleted: string[][] = [];
    const scanCalls: string[] = [];

    const service = new RedisService({
      connect: async () => undefined,
      get: async () => null,
      set: async () => undefined,
      scan: async (cursor: string) => {
        scanCalls.push(cursor);

        if (cursor === "0") {
          return ["1", ["tasks:1", "tasks:2"]];
        }

        return ["0", ["tasks:3"]];
      },
      del: async (...keys: string[]) => {
        deleted.push(keys);
        return keys.length;
      },
      quit: async () => undefined,
    });

    await service.deleteByPrefix("tasks:");

    assert.deepEqual(scanCalls, ["0", "1"]);
    assert.deepEqual(deleted, [["tasks:1", "tasks:2"], ["tasks:3"]]);
  });
});
