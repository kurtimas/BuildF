import { createServerFn } from "@tanstack/react-start";

export type PublishedFloor = {
  layout: string | null;
  updatedAt: string | null;
  hasPassword: boolean;
};

export type PublishResult =
  | { ok: true; updatedAt: string }
  | { ok: false; error: string };

export const loadPublishedFloor = createServerFn({ method: "GET" }).handler(async (): Promise<PublishedFloor> => {
  const { readPublished } = await import("./publish.server");
  return readPublished();
});

export const savePublishedFloor = createServerFn({ method: "POST" })
  .validator((input: { password?: string; layout?: string }) => ({
    password: typeof input?.password === "string" ? input.password : "",
    layout: typeof input?.layout === "string" ? input.layout : "",
  }))
  .handler(async ({ data }): Promise<PublishResult> => {
    const { writePublished } = await import("./publish.server");
    return writePublished(data);
  });
