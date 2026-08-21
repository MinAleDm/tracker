import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import supertest from "supertest";
import { io, type Socket } from "socket.io-client";
import { createTestApp, testIds } from "./support/test-app";

async function waitForConnection(socket: Socket) {
  await new Promise<void>((resolve, reject) => {
    socket.once("connect", () => resolve());
    socket.once("connect_error", (error) => reject(error));
  });
}

async function subscribeToProject(socket: Socket, projectId: string) {
  return new Promise<{ subscribed?: string; status?: string; message?: string }>((resolve) => {
    socket.emit("project:subscribe", projectId, (response: { subscribed?: string; status?: string; message?: string }) => resolve(response));
  });
}

async function waitForSubscriptionError(socket: Socket, projectId: string) {
  return new Promise<{ status?: string; message?: string }>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timed out waiting for subscription error")), 3_000);

    socket.once("exception", (response) => {
      clearTimeout(timeout);
      resolve(response as { status?: string; message?: string });
    });
    socket.emit("project:subscribe", projectId);
  });
}

async function waitForTaskEvent(socket: Socket) {
  return new Promise<{ projectId: string; taskId: string; action: string }>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timed out waiting for realtime task event"));
    }, 3_000);

    socket.once("task:changed", (event) => {
      clearTimeout(timeout);
      resolve(event as { projectId: string; taskId: string; action: string });
    });
  });
}

describe("realtime flow", () => {
  const appsToClose = new Set<Awaited<ReturnType<typeof createTestApp>>>();
  const socketsToClose = new Set<Socket>();

  afterEach(async () => {
    for (const socket of socketsToClose) {
      socket.disconnect();
    }

    socketsToClose.clear();

    for (const context of appsToClose) {
      await context.app.close();
    }

    appsToClose.clear();
  });

  it("broadcasts task updates to subscribed project clients", async () => {
    const context = await createTestApp();
    appsToClose.add(context);

    const request = supertest(context.app.getHttpServer());

    const loginResponse = await request.post("/api/v1/auth/login").send({
      email: "owner@tracker.local",
      password: "changeme123",
    });

    const accessToken = loginResponse.body.tokens.accessToken as string;

    const createResponse = await request
      .post(`/api/v1/projects/${testIds.projectId}/tasks`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Realtime coverage",
        description: "Verify socket broadcasts when a task changes.",
      });

    const taskId = createResponse.body.id as string;

    const socket = io(`${context.baseUrl}/tasks`, {
      auth: {
        token: accessToken,
      },
      transports: ["websocket"],
    });

    socketsToClose.add(socket);

    await waitForConnection(socket);
    const subscription = await subscribeToProject(socket, testIds.projectId);
    assert.equal(subscription.subscribed, testIds.projectId);

    const taskEventPromise = waitForTaskEvent(socket);

    const updateResponse = await request
      .patch(`/api/v1/tasks/${taskId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        status: "DONE",
      });

    assert.equal(updateResponse.status, 200);

    const event = await taskEventPromise;

    assert.deepEqual(event, {
      projectId: testIds.projectId,
      taskId,
      action: "updated",
    });
  });

  it("rejects subscriptions outside the authenticated user's organization", async () => {
    const context = await createTestApp();
    appsToClose.add(context);

    const request = supertest(context.app.getHttpServer());
    const loginResponse = await request.post("/api/v1/auth/login").send({
      email: "outsider@tracker.local",
      password: "changeme123",
    });
    const accessToken = loginResponse.body.tokens.accessToken as string;
    const socket = io(`${context.baseUrl}/tasks`, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });

    socketsToClose.add(socket);
    await waitForConnection(socket);

    const subscription = await waitForSubscriptionError(socket, testIds.projectId);

    assert.equal(subscription.status, "error");
    assert.match(subscription.message ?? "", /access denied/i);
  });
});
