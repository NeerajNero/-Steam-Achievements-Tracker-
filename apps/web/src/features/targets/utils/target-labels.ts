import {
  AccountTargetResponseDtoPriorityEnum,
  AccountTargetResponseDtoStatusEnum,
  AccountTargetResponseDtoTypeEnum,
  type AccountTargetResponseDto,
} from '@steam-achievement/client-sdk';

export function getPriorityLabel(
  priority: AccountTargetResponseDtoPriorityEnum,
): string {
  if (priority === AccountTargetResponseDtoPriorityEnum.High) {
    return 'High priority';
  }

  if (priority === AccountTargetResponseDtoPriorityEnum.Low) {
    return 'Low priority';
  }

  return 'Medium priority';
}

export function getStatusLabel(status: AccountTargetResponseDtoStatusEnum): string {
  if (status === AccountTargetResponseDtoStatusEnum.Active) {
    return 'Active';
  }

  if (status === AccountTargetResponseDtoStatusEnum.Paused) {
    return 'Paused';
  }

  if (status === AccountTargetResponseDtoStatusEnum.Completed) {
    return 'Completed';
  }

  if (status === AccountTargetResponseDtoStatusEnum.Ignored) {
    return 'Ignored';
  }

  return 'Archived';
}

export function getTargetTitle(target: AccountTargetResponseDto): string {
  if (
    target.type === AccountTargetResponseDtoTypeEnum.Achievement &&
    target.achievement
  ) {
    return target.achievement.displayName ?? target.achievement.apiName;
  }

  return target.game.name;
}

export function getTargetSubtitle(target: AccountTargetResponseDto): string {
  if (
    target.type === AccountTargetResponseDtoTypeEnum.Achievement &&
    target.achievement
  ) {
    return `${target.game.name} / ${target.achievement.apiName}`;
  }

  const remaining = Math.max(
    0,
    target.game.totalAchievements - target.game.unlockedAchievements,
  );

  return `${target.game.unlockedAchievements}/${target.game.totalAchievements} unlocked / ${remaining} remaining`;
}
