import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import type { AuthenticatedUserContext } from '../auth/authenticated-user.types';
import { DashboardService } from './dashboard.service';
import { MyDashboardResponseDto } from './dto/dashboard-response.dto';

@Controller('dashboard')
@ApiTags('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    operationId: 'getMyDashboard',
    summary: 'Get the signed-in hunter command center dashboard',
  })
  @ApiOkResponse({ type: MyDashboardResponseDto })
  @ApiUnauthorizedResponse({ description: 'No active session.' })
  getMyDashboard(
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<MyDashboardResponseDto> {
    return this.dashboardService.getMyDashboard(currentUser);
  }
}
