export class SteamApiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SteamApiConfigError';
  }
}

export class SteamApiRequestError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'SteamApiRequestError';
  }
}

export class SteamApiRateLimitError extends SteamApiRequestError {
  constructor(message: string, statusCode = 429) {
    super(message, statusCode);
    this.name = 'SteamApiRateLimitError';
  }
}

export class SteamApiNotFoundOrPrivateError extends SteamApiRequestError {
  constructor(message: string, statusCode?: number) {
    super(message, statusCode);
    this.name = 'SteamApiNotFoundOrPrivateError';
  }
}
