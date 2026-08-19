import { z } from 'zod';

const apiEnvSchema = z.object({
  APP_ENV: z.enum(['local', 'test', 'stage', 'production']),
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().int().min(1).max(65535).default(3333),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function parseApiEnv(source: NodeJS.ProcessEnv): ApiEnv {
  const result = apiEnvSchema.safeParse(source);

  if (!result.success) {
    throw new Error(`Invalid API environment:\n${z.prettifyError(result.error)}`);
  }

  return result.data;
}
