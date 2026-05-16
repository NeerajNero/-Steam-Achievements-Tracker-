import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { HealthResponseDto } from './dto/health-response.dto';

@Controller('health')
@ApiTags('health')
export class HealthController {
  @Get()
  @ApiOperation({
    operationId: 'healthCheck',
    summary: 'Check backend health',
    description: 'Returns a minimal liveness response for local smoke checks.',
  })
  @ApiOkResponse({ type: HealthResponseDto })
  getHealth(): HealthResponseDto {
    return { status: 'ok' };
  }
}
