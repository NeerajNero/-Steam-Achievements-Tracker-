import { describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';

import type { SyncRunsDataService } from '../../db/services/sync-runs-data.service';
import { SteamApiRequestError } from '../steam/steam-api.errors';
import type { SyncJobData } from './sync-job.types';
import { SyncProcessor } from './sync.processor';
import type { SyncWorkflowService } from './sync-workflow.service';

describe('SyncProcessor', () => {
  it('marks a sync run running before calling the profile workflow', async () => {
    const { processor, syncRunsRepository, workflow } = createProcessor();
    const job = createJob({ scope: 'profile' });

    await processor.process(job);

    expect(syncRunsRepository.markRunning).toHaveBeenCalledWith('sync-run-id');
    expect(workflow.execute).toHaveBeenCalledWith(job.data);
    expect(
      syncRunsRepository.markRunning.mock.invocationCallOrder[0],
    ).toBeLessThan(workflow.execute.mock.invocationCallOrder[0]);
  });

  it('calls the games workflow for games scope', async () => {
    const { processor, workflow } = createProcessor();
    const job = createJob({ scope: 'games' });

    await processor.process(job);

    expect(workflow.execute).toHaveBeenCalledWith({
      syncRunId: 'sync-run-id',
      steamId: '76561198000000000',
      scope: 'games',
    });
  });

  it('routes achievements scope to the workflow with app IDs', async () => {
    const { processor, workflow } = createProcessor();
    const job = createJob({ scope: 'achievements', appIds: [910001, 910002] });

    await processor.process(job);

    expect(workflow.execute).toHaveBeenCalledWith({
      syncRunId: 'sync-run-id',
      steamId: '76561198000000000',
      scope: 'achievements',
      appIds: [910001, 910002],
    });
  });


  it('does not mark failed after a successful workflow', async () => {
    const { processor, syncRunsRepository } = createProcessor();

    await processor.process(createJob({ scope: 'profile' }));

    expect(syncRunsRepository.markFailed).not.toHaveBeenCalled();
  });

  it('marks failed on final workflow failure and rethrows', async () => {
    const error = new SteamApiRequestError('upstream failed', 503);
    const { processor, syncRunsRepository, workflow } = createProcessor();
    workflow.execute.mockRejectedValue(error);

    await expect(
      processor.process(
        createJob({ scope: 'profile', attemptsMade: 2, attempts: 3 }),
      ),
    ).rejects.toBe(error);
    expect(syncRunsRepository.markFailed).toHaveBeenCalledWith(
      'sync-run-id',
      'Steam API request failed during sync.',
      {
        scope: 'profile',
        steamId: '76561198000000000',
      },
    );
  });

  it('does not mark failed before BullMQ exhausts attempts', async () => {
    const error = new SteamApiRequestError('upstream failed', 503);
    const { processor, syncRunsRepository, workflow } = createProcessor();
    workflow.execute.mockRejectedValue(error);

    await expect(
      processor.process(
        createJob({ scope: 'profile', attemptsMade: 0, attempts: 3 }),
      ),
    ).rejects.toBe(error);
    expect(syncRunsRepository.markFailed).not.toHaveBeenCalled();
  });
});

function createProcessor() {
  const workflow = {
    execute: vi.fn(),
  };
  const syncRunsRepository = {
    markRunning: vi.fn(),
    markFailed: vi.fn(),
  };

  return {
    workflow,
    syncRunsRepository,
    processor: new SyncProcessor(
      workflow as unknown as SyncWorkflowService,
      syncRunsRepository as unknown as SyncRunsDataService,
    ),
  };
}

function createJob(input: {
  scope: 'profile' | 'games' | 'achievements';
  appIds?: number[];
  attemptsMade?: number;
  attempts?: number;
}): Job<SyncJobData> {
  return {
    data: {
      syncRunId: 'sync-run-id',
      steamId: '76561198000000000',
      scope: input.scope,
      ...(input.appIds === undefined ? {} : { appIds: input.appIds }),
    },
    attemptsMade: input.attemptsMade ?? 0,
    opts: {
      attempts: input.attempts ?? 3,
    },
  } as Job<SyncJobData>;
}
