export const AUTH_CALLBACK_REASON_CODES = {
  AuthStateMissing: 'auth_state_missing',
  AuthStateInvalid: 'auth_state_invalid',
  OpenIdMissingRequiredFields: 'openid_missing_required_fields',
  OpenIdCancelled: 'openid_cancelled',
  OpenIdVerificationFailed: 'openid_verification_failed',
  OpenIdVerificationRequestFailed: 'openid_verification_request_failed',
  SteamIdExtractFailed: 'steam_id_extract_failed',
  SteamProfileUpsertFailed: 'steam_profile_upsert_failed',
  AppUserLinkFailed: 'app_user_link_failed',
  SessionCreateFailed: 'session_create_failed',
  CallbackUnexpectedError: 'callback_unexpected_error',
} as const;

export type AuthCallbackReasonCode =
  (typeof AUTH_CALLBACK_REASON_CODES)[keyof typeof AUTH_CALLBACK_REASON_CODES];

export class AuthCallbackError extends Error {
  constructor(
    readonly reasonCode: AuthCallbackReasonCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'AuthCallbackError';
  }
}

export function getAuthCallbackReasonCode(
  error: unknown,
): AuthCallbackReasonCode {
  if (error instanceof AuthCallbackError) {
    return error.reasonCode;
  }

  return AUTH_CALLBACK_REASON_CODES.CallbackUnexpectedError;
}
