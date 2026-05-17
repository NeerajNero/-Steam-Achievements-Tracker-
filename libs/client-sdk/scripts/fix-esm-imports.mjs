import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const distDir = resolve('dist');

function listJavaScriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return listJavaScriptFiles(path);
    }

    return entry.isFile() && entry.name.endsWith('.js') ? [path] : [];
  });
}

function resolveSpecifier(filePath, specifier) {
  if (!specifier.startsWith('.') || specifier.endsWith('.js') || specifier.endsWith('.json')) {
    return specifier;
  }

  const absoluteTarget = resolve(dirname(filePath), specifier);

  if (existsSync(`${absoluteTarget}.js`)) {
    return `${specifier}.js`;
  }

  if (existsSync(join(absoluteTarget, 'index.js'))) {
    return `${specifier}/index.js`;
  }

  return specifier;
}

for (const filePath of listJavaScriptFiles(distDir)) {
  const source = readFileSync(filePath, 'utf8');
  const updated = source.replace(
    /(from\s+['"])(\.[^'"]+)(['"])/g,
    (_match, prefix, specifier, suffix) => `${prefix}${resolveSpecifier(filePath, specifier)}${suffix}`,
  );

  if (updated !== source) {
    writeFileSync(filePath, updated);
  }
}
