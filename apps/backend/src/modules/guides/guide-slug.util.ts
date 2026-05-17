export function createGuideSlug(title: string): string {
  const normalized = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80)
    .replace(/-+$/g, '');

  if (normalized.length >= 3) {
    return normalized;
  }

  return `guide-${normalized || 'draft'}`.slice(0, 80).replace(/-+$/g, '');
}
