import { killPort } from '@nx/node/utils';

type GlobalWithTeardownMessage = typeof globalThis & {
  __TEARDOWN_MESSAGE__: string;
};

export default async function globalTeardown() {
  // Put clean up logic here (e.g. stopping services, docker-compose, etc.).
  // Hint: `globalThis` is shared between setup and teardown.
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await killPort(port);
  console.log((globalThis as GlobalWithTeardownMessage).__TEARDOWN_MESSAGE__);
}
