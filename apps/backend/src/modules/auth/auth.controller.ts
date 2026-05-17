import {
  ApiFoundResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Redirect,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';

import type { Request, Response } from 'express';

import { AuthCookieService } from './auth-cookie.service';
import {
  AUTH_CALLBACK_REASON_CODES,
  getAuthCallbackReasonCode,
} from './auth-callback-error';
import { AuthMeResponseDto, StartSteamLoginQueryDto } from './dto/auth-me-response.dto';
import { AuthService } from './auth.service';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly authCookieService: AuthCookieService,
  ) {}

  @Get('steam/login')
  @Redirect()
  @ApiOperation({
    operationId: 'startSteamLogin',
    summary: 'Start Sign in with Steam',
    description:
      'Starts the OpenID login flow and redirects the browser to Steam.',
  })
  @ApiQuery({
    name: 'returnTo',
    required: false,
    type: String,
    description:
      'Optional frontend path to return to after a successful login. Relative paths only.',
  })
  @ApiFoundResponse({ description: 'Redirects to Steam OpenID login URL.' })
  startSteamLogin(
    @Query() query: StartSteamLoginQueryDto,
    @Res({ passthrough: true }) response: Response,
  ): { url: string } {
    const returnTo = this.authService.parseReturnTo(query.returnTo);
    const payload = this.authService.buildLoginStatePayload(returnTo);

    this.authCookieService.setStateCookie(response, payload);

    return { url: this.authService.buildLoginUrl(payload.state) };
  }

  @Get('steam/callback')
  @HttpCode(HttpStatus.FOUND)
  @ApiOperation({
    operationId: 'handleSteamCallback',
    summary: 'Handle Steam OpenID callback',
    description: 'Validates the OpenID response and creates/restores an application session.',
  })
  @ApiFoundResponse({ description: 'Redirects to frontend after authentication.' })
  @ApiUnauthorizedResponse({ description: 'OpenID state is invalid or expired.' })
  async handleSteamCallback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    this.logger.log('event=callback_started');
    const statePayload = this.authCookieService.consumeStateCookie(request);

    if (statePayload === null) {
      this.authCookieService.clearStateCookie(response);
      this.logCallbackFailure(
        AUTH_CALLBACK_REASON_CODES.AuthStateMissing,
        'OpenID state cookie is missing or expired.',
        { requiredFieldsPresent: hasMinimumOpenIdCallbackFields(request.query) },
      );
      response.redirect(
        HttpStatus.FOUND,
        this.buildFrontendRedirectUrl(
          '/',
          undefined,
          false,
          AUTH_CALLBACK_REASON_CODES.AuthStateMissing,
        ),
      );

      return;
    }

    try {
      const callbackQuery = collectQueryParams(request.query);

      const sessionInfo = await this.authService.handleOpenIdCallbackAndCreateSession(
        callbackQuery,
        statePayload,
        request,
      );

      this.authCookieService.setSessionCookie(response, sessionInfo.session.token);
      this.authCookieService.clearStateCookie(response);
      this.logger.log(
        `event=session_created userId=${sessionInfo.userId} steamId=${sessionInfo.steamId} steamProfileId=${sessionInfo.steamProfileId}`,
      );

      this.logger.log(
        `event=callback_redirecting status=success steamId=${sessionInfo.steamId}`,
      );
      response.redirect(
        HttpStatus.FOUND,
        this.buildFrontendRedirectUrl(statePayload.returnTo, sessionInfo.steamId, true),
      );
    } catch (error: unknown) {
      this.authCookieService.clearStateCookie(response);
      const reasonCode = getAuthCallbackReasonCode(error);
      this.logCallbackFailure(reasonCode, 'Steam auth callback failed.', {
        requiredFieldsPresent: hasMinimumOpenIdCallbackFields(request.query),
      });
      response.redirect(
        HttpStatus.FOUND,
        this.buildFrontendRedirectUrl(
          statePayload.returnTo,
          undefined,
          false,
          reasonCode,
        ),
      );
      return;
    }
  }

  @Get('me')
  @ApiOperation({
    operationId: 'getCurrentUser',
    summary: 'Get current authenticated user/session',
    description:
      'Returns user identity and linked Steam account information for the current session.',
  })
  @ApiOkResponse({ type: AuthMeResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  async getCurrentUser(@Req() request: Request): Promise<AuthMeResponseDto> {
    const token = this.authCookieService.getSessionToken(request);

    if (token === null) {
      throw new UnauthorizedException('No session token found.');
    }

    const currentUser = await this.authService.getCurrentUser(token);

    if (currentUser === null) {
      throw new UnauthorizedException('No authenticated user found for this session.');
    }

    return currentUser as AuthMeResponseDto;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'logout',
    summary: 'Sign out current user',
    description: 'Revokes the current session and clears the auth cookie.',
  })
  @ApiNoContentResponse({ description: 'Session cleared.' })
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<void> {
    const token = this.authCookieService.getSessionToken(request);

    if (token !== null) {
      await this.authService.revokeSession(token);
    }

    this.authCookieService.clearSessionCookie(response);
  }

  private buildFrontendRedirectUrl(
    returnTo: string,
    steamId?: string,
    isSuccess = false,
    errorCode?: string,
  ): string {
    const config = this.authService.getAuthCookieConfig();
    const frontendBaseUrl = config.frontendPublicUrl.replace(/\/+$/, '');
    const normalizedReturnTo = this.authService.normalizeReturnTo(returnTo);
    const safePath =
      isSuccess && steamId !== undefined && normalizedReturnTo === '/'
        ? `/profiles/${steamId}`
        : normalizedReturnTo;

    if (errorCode === undefined) {
      return `${frontendBaseUrl}${safePath}`;
    }

    const joiner = safePath.includes('?') ? '&' : '?';
    return `${frontendBaseUrl}${safePath}${joiner}auth_error=${encodeURIComponent(errorCode)}`;
  }

  private logCallbackFailure(
    reasonCode: string,
    safeMessage: string,
    context: { requiredFieldsPresent: boolean },
  ): void {
    this.logger.warn(
      `event=callback_failed reasonCode=${reasonCode} message="${safeMessage}" requiredFieldsPresent=${context.requiredFieldsPresent}`,
    );
  }
}

function collectQueryParams(query: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, rawValue] of Object.entries(query)) {
    if (typeof rawValue === 'string') {
      result[key] = rawValue;
    } else if (Array.isArray(rawValue)) {
      if (rawValue.length > 0 && typeof rawValue[0] === 'string') {
        result[key] = rawValue[0];
      }
    }
  }

  return result;
}

function hasMinimumOpenIdCallbackFields(query: Record<string, unknown>): boolean {
  return (
    typeof query['openid.mode'] === 'string' &&
    typeof query['openid.claimed_id'] === 'string' &&
    typeof query['openid.identity'] === 'string'
  );
}
