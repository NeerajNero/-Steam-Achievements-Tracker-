'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { AuthStatus } from '@/features/auth/components/auth-status';
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
    <Suspense fallback={<main className="p-6 text-sm text-slate-500">Loading games...</main>}>
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
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm font-medium text-blue-700" href="/">
          Back to home
        </Link>
        <AuthStatus />
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          Steam Games
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Browse Steam games already discovered through profile syncs. These pages are
          database-backed and do not call Steam directly from the browser.
        </p>
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
    </main>
  );
}
