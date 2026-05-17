import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AppUsersDataService } from '../../db/services/app-users-data.service';
import { PublicProfilesDataService } from '../../db/services/public-profiles-data.service';
import { SteamProfilesDataService } from '../../db/services/steam-profiles-data.service';
import { UserPreferencesDataService } from '../../db/services/user-preferences-data.service';
import { UserSteamAccountsDataService } from '../../db/services/user-steam-accounts-data.service';
import type {
  AccountPreferenceSettings,
  AccountResponseDto,
  PublicProfileSettings,
} from './dto/account-response.dto';
import type { UpdateAccountDto } from './dto/update-account.dto';
import type { UpdatePreferencesDto } from './dto/update-preferences.dto';
import type { UpdatePublicProfileSettingsDto } from './dto/update-public-profile-settings.dto';

const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'auth',
  'account',
  'profiles',
  'games',
  'settings',
  'docs',
  'health',
]);

@Injectable()
export class AccountService {
  constructor(
    private readonly appUsersDataService: AppUsersDataService,
    private readonly userSteamAccountsDataService: UserSteamAccountsDataService,
    private readonly userPreferencesDataService: UserPreferencesDataService,
    private readonly publicProfilesDataService: PublicProfilesDataService,
    private readonly steamProfilesDataService: SteamProfilesDataService,
  ) {}

  async getAccount(userId: string): Promise<AccountResponseDto> {
    const user = await this.appUsersDataService.findById(userId);

    if (user === null) {
      throw new NotFoundException('Account was not found.');
    }

    const [primaryAccount, preferences] = await Promise.all([
      this.userSteamAccountsDataService.findPrimaryByUserId(userId),
      this.ensurePreferences(userId),
    ]);

    if (primaryAccount === null) {
      return {
        user: mapUser(user),
        steamAccount: null,
        preferences: { settings: normalizePreferenceSettings(preferences.settings) },
        publicProfile: null,
      };
    }

    const [steamProfile, publicProfile] = await Promise.all([
      this.steamProfilesDataService.findById(primaryAccount.steamProfileId),
      this.ensurePublicProfile(userId, primaryAccount.steamProfileId),
    ]);

    return {
      user: mapUser(user),
      steamAccount: {
        steamId: primaryAccount.steamId,
        steamProfileId: primaryAccount.steamProfileId,
        personaName: steamProfile?.personaName ?? null,
        avatarUrl: steamProfile?.avatarUrl ?? null,
        isPrimary: primaryAccount.isPrimary,
      },
      preferences: {
        settings: normalizePreferenceSettings(preferences.settings),
      },
      publicProfile: {
        slug: publicProfile.slug,
        isPublic: publicProfile.isPublic,
        settings: normalizePublicProfileSettings(publicProfile.settings),
      },
    };
  }

  async updateAccount(
    userId: string,
    input: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    const normalized = {
      displayName:
        input.displayName === undefined ? undefined : input.displayName.trim(),
      avatarUrl:
        input.avatarUrl === undefined
          ? undefined
          : input.avatarUrl === null
            ? null
            : input.avatarUrl.trim(),
    };
    const updated = await this.appUsersDataService.update(userId, normalized);

    if (updated === null) {
      throw new NotFoundException('Account was not found.');
    }

    return this.getAccount(userId);
  }

  async getPreferences(userId: string): Promise<{ settings: AccountPreferenceSettings }> {
    const preferences = await this.ensurePreferences(userId);

    return { settings: normalizePreferenceSettings(preferences.settings) };
  }

  async updatePreferences(
    userId: string,
    input: UpdatePreferencesDto,
  ): Promise<{ settings: AccountPreferenceSettings }> {
    const settings = normalizePreferenceSettings(input.settings);
    const preferences = await this.userPreferencesDataService.upsertSettings(
      userId,
      settings,
    );

    return { settings: normalizePreferenceSettings(preferences.settings) };
  }

  async getPublicProfileSettings(
    userId: string,
  ): Promise<{ slug: string | null; isPublic: boolean; settings: PublicProfileSettings }> {
    const publicProfile = await this.ensurePrimaryPublicProfile(userId);

    return {
      slug: publicProfile.slug,
      isPublic: publicProfile.isPublic,
      settings: normalizePublicProfileSettings(publicProfile.settings),
    };
  }

  async updatePublicProfileSettings(
    userId: string,
    input: UpdatePublicProfileSettingsDto,
  ): Promise<{ slug: string | null; isPublic: boolean; settings: PublicProfileSettings }> {
    const publicProfile = await this.ensurePrimaryPublicProfile(userId);
    const nextSlug =
      input.slug === undefined ? undefined : normalizeSlugInput(input.slug);

    if (nextSlug !== undefined && nextSlug !== null) {
      await this.ensureSlugAvailable(nextSlug, publicProfile.id);
    }

    const updated = await this.publicProfilesDataService.updateById(publicProfile.id, {
      slug: nextSlug,
      isPublic: input.isPublic,
      settings:
        input.settings === undefined
          ? undefined
          : normalizePublicProfileSettings(input.settings),
    }).catch((error: unknown) => {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Public profile slug is already in use.');
      }

      throw error;
    });

    if (updated === null) {
      throw new NotFoundException('Public profile settings were not found.');
    }

    return {
      slug: updated.slug,
      isPublic: updated.isPublic,
      settings: normalizePublicProfileSettings(updated.settings),
    };
  }

  private async ensurePreferences(userId: string) {
    return (
      (await this.userPreferencesDataService.findByUserId(userId)) ??
      (await this.userPreferencesDataService.create(userId))
    );
  }

  private async ensurePrimaryPublicProfile(userId: string) {
    const primaryAccount =
      await this.userSteamAccountsDataService.findPrimaryByUserId(userId);

    if (primaryAccount === null) {
      throw new NotFoundException('No linked Steam profile was found.');
    }

    return this.ensurePublicProfile(userId, primaryAccount.steamProfileId);
  }

  private async ensurePublicProfile(userId: string, steamProfileId: string) {
    return (
      (await this.publicProfilesDataService.findByUserAndProfileId(
        userId,
        steamProfileId,
      )) ??
      (await this.publicProfilesDataService.create({
        userId,
        steamProfileId,
        isPublic: true,
      }))
    );
  }

  private async ensureSlugAvailable(
    slug: string,
    currentPublicProfileId: string,
  ): Promise<void> {
    const existing = await this.publicProfilesDataService.findBySlug(slug);

    if (existing !== null && existing.id !== currentPublicProfileId) {
      throw new ConflictException('Public profile slug is already in use.');
    }
  }
}

function mapUser(user: {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
}) {
  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    status: user.status,
  };
}

function normalizePreferenceSettings(value: unknown): AccountPreferenceSettings {
  if (!isRecord(value)) {
    return {};
  }

  const settings: AccountPreferenceSettings = {};

  if (isDefaultGameSort(value.defaultGameSort)) {
    settings.defaultGameSort = value.defaultGameSort;
  }

  if (value.defaultGameOrder === 'asc' || value.defaultGameOrder === 'desc') {
    settings.defaultGameOrder = value.defaultGameOrder;
  }

  if (typeof value.showPrivateHints === 'boolean') {
    settings.showPrivateHints = value.showPrivateHints;
  }

  return settings;
}

function normalizePublicProfileSettings(value: unknown): PublicProfileSettings {
  if (!isRecord(value)) {
    return {};
  }

  const settings: PublicProfileSettings = {};

  if (typeof value.showRarestAchievements === 'boolean') {
    settings.showRarestAchievements = value.showRarestAchievements;
  }

  if (typeof value.showRecentSyncs === 'boolean') {
    settings.showRecentSyncs = value.showRecentSyncs;
  }

  if (typeof value.showSteamId === 'boolean') {
    settings.showSteamId = value.showSteamId;
  }

  return settings;
}

function normalizeSlugInput(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const slug = value.trim().toLowerCase();

  if (!/^[a-z0-9-]{3,64}$/.test(slug)) {
    throw new BadRequestException(
      'Public profile slug must be 3 to 64 lowercase letters, numbers, or hyphens.',
    );
  }

  if (RESERVED_SLUGS.has(slug)) {
    throw new BadRequestException('Public profile slug is reserved.');
  }

  return slug;
}

function isDefaultGameSort(
  value: unknown,
): value is NonNullable<AccountPreferenceSettings['defaultGameSort']> {
  return (
    value === 'completion' ||
    value === 'name' ||
    value === 'playtime' ||
    value === 'recently_played' ||
    value === 'remaining'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  );
}
