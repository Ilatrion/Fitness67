import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createAIHandler, validImage, validResult } from "../server/ai.mjs";
const image =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7l8AAAAASUVORK5CYII=";
async function withServer(options, fn) {
  const server = createServer(createAIHandler(options));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    await fn(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}
const request = (url, token = "test", body = { image, mime: "image/png" }) =>
  fetch(url + "/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(body),
  });
test("photo signatures and food results validated", () => {
  assert.ok(validImage(image, "image/png"));
  assert.equal(validImage(image, "image/jpeg"), false);
  assert.equal(validResult({ recognized: false }), false);
});
test("unconfigured server returns 503, never fake calories", () =>
  withServer({ apiKey: "", accessToken: "" }, async (url) => {
    const r = await request(url);
    assert.equal(r.status, 503);
    assert.match((await r.json()).error, /не подключено/);
  }));
test("unauthorized request never calls provider", () =>
  withServer(
    {
      apiKey: "secret",
      accessToken: "test",
      providerFetch: () => {
        throw Error("must not call");
      },
    },
    async (url) => {
      assert.equal((await request(url, "wrong")).status, 401);
    },
  ));
test("non-food is rejected and valid food returned for user review", async () => {
  let nonFood = true;
  const result = {
    recognized: true,
    name: "Омлет",
    estimatedGrams: 180,
    per100: { kcal: 154, protein: 10, fat: 11, carbs: 2 },
    uncertainty: "Масло не видно",
  };
  await withServer(
    {
      apiKey: "secret",
      accessToken: "test",
      providerFetch: async (_url, opts) => {
        const body = JSON.parse(opts.body);
        assert.equal(body.store, false);
        assert.equal(opts.headers.Authorization, "Bearer secret");
        return new Response(
          JSON.stringify({
            output: [
              {
                content: [
                  {
                    type: "output_text",
                    text: JSON.stringify(
                      nonFood ? { ...result, recognized: false } : result,
                    ),
                  },
                ],
              },
            ],
          }),
        );
      },
    },
    async (url) => {
      assert.equal((await request(url)).status, 422);
      nonFood = false;
      const r = await request(url);
      assert.equal(r.status, 200);
      assert.equal((await r.json()).result.name, "Омлет");
    },
  );
});
test("CORS rejects unapproved websites", () =>
  withServer(
    {
      apiKey: "secret",
      accessToken: "test",
      allowedOrigin: "https://example.test",
    },
    async (url) => {
      const r = await fetch(url + "/health", {
        headers: { Origin: "https://other.test" },
      });
      assert.equal(r.status, 403);
    },
  ));
