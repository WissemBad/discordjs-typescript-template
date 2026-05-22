import { expect, test } from "bun:test";
import { apiKeyRequired } from "@bot/core";
import type { NextFunction, Request, Response } from "express";

test("apiKeyRequired rejects missing keys", () => {
  let statusCode = 0;
  let nextCalled = false;

  const middleware = apiKeyRequired({ apiKey: "super-secret-key" });
  middleware(
    {
      header: () => undefined,
    } as unknown as Request,
    {
      json: () => undefined,
      status: (code: number) => {
        statusCode = code;
        return {
          json: () => undefined,
        } as unknown as Response;
      },
    } as unknown as Response,
    (() => {
      nextCalled = true;
    }) as NextFunction,
  );

  expect(statusCode).toBe(401);
  expect(nextCalled).toBe(false);
});

test("apiKeyRequired accepts valid keys", () => {
  let nextCalled = false;

  const middleware = apiKeyRequired({ apiKey: "super-secret-key" });
  middleware(
    {
      header: () => "super-secret-key",
    } as unknown as Request,
    {} as Response,
    (() => {
      nextCalled = true;
    }) as NextFunction,
  );

  expect(nextCalled).toBe(true);
});
