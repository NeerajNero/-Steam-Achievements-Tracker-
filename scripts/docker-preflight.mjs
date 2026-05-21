import { spawnSync } from 'node:child_process';

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
  });

  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim(),
  };
}

function printStatus(label, ok, detail) {
  const state = ok ? 'OK' : 'MISSING';
  console.log(`${label}: ${state}`);

  if (detail) {
    console.log(`  ${detail}`);
  }
}

const docker = run('docker', ['--version']);

if (!docker.ok) {
  printStatus('docker', false, 'Install Docker Desktop or Docker Engine first.');
  process.exit(1);
}

const composePlugin = run('docker', ['compose', 'version']);
const composeStandalone = run('docker-compose', ['version']);
const buildx = run('docker', ['buildx', 'version']);

printStatus('docker', true, docker.output.split('\n')[0]);
printStatus(
  'compose-plugin',
  composePlugin.ok,
  composePlugin.ok ? composePlugin.output.split('\n')[0] : 'docker compose is unavailable.',
);
printStatus(
  'compose-standalone',
  composeStandalone.ok,
  composeStandalone.ok
    ? composeStandalone.output.split('\n')[0]
    : 'docker-compose is unavailable.',
);
printStatus(
  'buildx',
  buildx.ok,
  buildx.ok
    ? buildx.output.split('\n')[0]
    : 'App-image builds for backend/web are blocked until buildx is installed.',
);

if (!composePlugin.ok && !composeStandalone.ok) {
  console.log('\nAction required: install Docker Compose v2 or the standalone docker-compose binary.');
  process.exit(1);
}

if (!buildx.ok) {
  console.log('\nAction required: install or update Docker Desktop, or add the Docker buildx plugin.');
  console.log('Checks:');
  console.log('  docker compose version');
  console.log('  docker buildx version');
  console.log('\nValidated fallback while buildx is missing:');
  console.log('  docker-compose config --quiet');
  console.log('  POSTGRES_PORT=55432 REDIS_PORT=56379 docker-compose up -d postgres redis');
  console.log('  Run backend and web from the host against localhost services.');
  process.exit(1);
}

console.log('\nDocker preflight passed.');
console.log('Validated app-service command:');
console.log('  docker-compose up -d postgres redis backend web');
