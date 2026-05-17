'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { PageHero } from '@/components/layout/page-hero';
import { PageShell } from '@/components/layout/page-shell';
import { useGlobalGames } from '@/features/games/api/use-global-games';
import { GlobalGamesFilters } from '@/features/games/components/global-games-filters';
import { GlobalGamesList } from '@/features/games/components/global-games-list';
import {
  type GlobalGamesFilters as GlobalGamesFiltersType,
  normalizeGlobalGamesFilters,
  parseGlobalGamesFilters,
  toGlobalGamesSearchParams,
} from '@/features/games/utils/global-game-filters';

export default function GamesPage() {
  return (
    <Suspense fallback={<main className="p-6 text-sm text-slate-400">Loading games...</main>}>
      <GamesPageContent />
    </Suspense>
  );
}

function GamesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parsedSearchParams = useMemo(
    () => parseGlobalGamesFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [filters, setFilters] = useState<GlobalGamesFiltersType>(() =>
    normalizeGlobalGamesFilters(parsedSearchParams),
  );
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    const nextFilters = normalizeGlobalGamesFilters(parsedSearchParams);

    if (JSON.stringify(nextFilters) !== JSON.stringify(filters)) {
      setFilters(nextFilters);
      setSearchInput(nextFilters.search);
    }
  }, [filters, parsedSearchParams]);

  const games = useGlobalGames({
    search: filters.search || undefined,
    hasAchievements: filters.hasAchievements,
    sort: filters.sort,
    order: filters.order,
    limit: filters.limit,
    offset: filters.offset,
  });
  const total = games.data?.total ?? 0;

  function updateFilters(nextFilters: Partial<GlobalGamesFiltersType>): void {
    const normalizedFilters = normalizeGlobalGamesFilters(nextFilters);
    setFilters(normalizedFilters);

    const params = toGlobalGamesSearchParams(normalizedFilters);
    const href = params.length > 0 ? `${pathname}?${params}` : pathname;

    void router.replace(href, { scroll: false });
  }

  function onSubmitSearch(): void {
    updateFilters({
      ...filters,
      search: searchInput.trim(),
      offset: 0,
    });
  }

  return (
    <PageShell>
      <div className="mb-6">
        <PageHero eyebrow="Global game browser" title="Steam Games">
          <p>
          Browse Steam games already discovered through profile syncs. These pages are
          database-backed and do not call Steam directly from the browser.
          </p>
        </PageHero>
      </div>

      <div className="grid gap-6">
        <GlobalGamesFilters
          filters={filters}
          onHasAchievementsChange={(hasAchievements) =>
            updateFilters({ ...filters, hasAchievements, offset: 0 })
          }
          onLimitChange={(limit) => updateFilters({ ...filters, limit, offset: 0 })}
          onOrderChange={(order) => updateFilters({ ...filters, order })}
          onPageChange={(offset) => updateFilters({ ...filters, offset })}
          onSearchChange={setSearchInput}
          onSortChange={(sort) => updateFilters({ ...filters, sort, offset: 0 })}
          onSubmitSearch={onSubmitSearch}
          searchInput={searchInput}
          total={total}
        />
        <GlobalGamesList
          error={games.error}
          isError={games.isError}
          isLoading={games.isLoading}
          items={games.data?.items}
          total={games.data?.total}
        />
      </div>
    </PageShell>
  );
}
