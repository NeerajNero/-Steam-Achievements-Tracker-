import {
  DashboardGameRefResponseDtoAchievementDataStateEnum,
  DashboardNextTargetResponseDtoTypeEnum,
  type DashboardNextTargetResponseDto,
} from '@steam-achievement/client-sdk';

export function getTargetTypeLabel(
  type: DashboardNextTargetResponseDto['type'],
): string {
  switch (type) {
    case DashboardNextTargetResponseDtoTypeEnum.ClosestCompletion:
      return 'Close completion';
    case DashboardNextTargetResponseDtoTypeEnum.RecentlyPlayedIncomplete:
      return 'Recent momentum';
    case DashboardNextTargetResponseDtoTypeEnum.HighPlaytimeUnfinished:
      return 'High playtime';
    case DashboardNextTargetResponseDtoTypeEnum.MetadataOnly:
      return 'Unknown unlock state';
    case DashboardNextTargetResponseDtoTypeEnum.NotSynced:
      return 'Needs metadata';
    case DashboardNextTargetResponseDtoTypeEnum.GuideAvailable:
      return 'Guide available';
    case DashboardNextTargetResponseDtoTypeEnum.SessionAvailable:
      return 'Session available';
  }
}

export function getTargetReason(target: DashboardNextTargetResponseDto): string {
  return target.reason;
}

export function getDataQualityLabel(
  state: DashboardGameRefResponseDtoAchievementDataStateEnum,
): string {
  if (state === DashboardGameRefResponseDtoAchievementDataStateEnum.MetadataOnly) {
    return 'Achievement metadata is available, but Steam did not provide unlock state.';
  }

  if (state === DashboardGameRefResponseDtoAchievementDataStateEnum.NotSynced) {
    return 'Achievement metadata has not been synced for this game yet.';
  }

  if (state === DashboardGameRefResponseDtoAchievementDataStateEnum.NoAchievements) {
    return 'Steam data indicates this game has no achievements.';
  }

  return 'Achievement unlock state is synced.';
}
