import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequiresPaidFeature } from '../../common/pricing/requires-paid-feature.decorator';
import { PaidFeatureGuard } from '../../common/pricing/paid-feature.guard';
import { AskAiAssistantDto } from './dto';
import { AiService } from './ai.service';

@Controller('clubs/:clubId/ai')
@UseGuards(JwtAuthGuard, PaidFeatureGuard)
@RequiresPaidFeature('ai_assistant')
export class AiController {
  constructor(private ai: AiService) {}

  @Get('insights')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stats.read')
  insights(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Query('range') range: string = '30d',
    @Query('days') days: string = '7',
  ) {
    return this.ai.getInsights(req.user.sub, clubId, range, Number(days));
  }

  @Get('schedule')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('operations.read')
  schedule(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Query('range') range: string = '30d',
    @Query('days') days: string = '7',
  ) {
    return this.ai.getSchedule(req.user.sub, clubId, range, Number(days));
  }

  @Get('skills')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stats.read')
  skills(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Query('range') range: string = '30d',
  ) {
    return this.ai.getSkills(req.user.sub, clubId, range);
  }

  @Get('recommendations')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stats.read')
  recommendations(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Query('range') range: string = '30d',
    @Query('days') days: string = '7',
  ) {
    return this.ai.getRecommendations(req.user.sub, clubId, range, Number(days));
  }

  @Post('assistant')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stats.read')
  assistant(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Body() dto: AskAiAssistantDto,
  ) {
    return this.ai.assistant(req.user.sub, clubId, dto);
  }
}
