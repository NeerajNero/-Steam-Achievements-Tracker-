import type { SyncScope } from './dto/sync-request.dto';

export interface SyncJobData {
  syncRunId: string;
  steamId: string;
  scope: SyncScope;
  appIds?: number[];
}
