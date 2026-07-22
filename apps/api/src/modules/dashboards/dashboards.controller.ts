import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PaidFeatureGuard } from '../../common/pricing/paid-feature.guard';
import { RequiresPaidFeature } from '../../common/pricing/requires-paid-feature.decorator';
import { DashboardsService } from './dashboards.service';
import { CreateDashboardAnalyticsEntryDto } from './dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardsController {
  constructor(private dashboards: DashboardsService) {}

  @Get('overview')
  overview(
    @Req() req: any,
    @Query('clubId') clubId?: string,
    @Query('as') asRole?: string,     // optional: COACH/PHYSIO/etc
  ) {
    const clubIdFromHeader = req.headers['x-club-id'] as string | undefined;
    return this.dashboards.overview(req.user.sub, clubIdFromHeader || clubId, asRole);
  }

  @Get('charts')
  charts(
    @Req() req: any,
    @Query('clubId') clubId?: string,
    @Query('range') range: string = '30d',
    @Query('as') asRole?: string,
  ) {
    const clubIdFromHeader = req.headers['x-club-id'] as string | undefined;
    return this.dashboards.charts(req.user.sub, clubIdFromHeader || clubId, range, asRole);
  }

  @Get('recent')
  recent(
    @Req() req: any,
    @Query('clubId') clubId?: string,
    @Query('limit') limit: string = '10',
    @Query('as') asRole?: string,
  ) {
    const clubIdFromHeader = req.headers['x-club-id'] as string | undefined;
    return this.dashboards.recent(req.user.sub, clubIdFromHeader || clubId, Number(limit), asRole);
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard, PaidFeatureGuard)
  @RequiresPaidFeature('advanced_analytics')
  analytics(
    @Req() req: any,
    @Query('clubId') clubId?: string,
    @Query('range') range: string = '30d',
    @Query('as') asRole?: string,
  ) {
    const clubIdFromHeader = req.headers['x-club-id'] as string | undefined;
    return this.dashboards.analytics(req.user.sub, clubIdFromHeader || clubId, range, asRole);
  }

  @Post('analytics')
  @UseGuards(JwtAuthGuard, PermissionsGuard, PaidFeatureGuard)
  @Permissions('analytics.write')
  @RequiresPaidFeature('advanced_analytics_write')
  createAnalytics(
    @Req() req: any,
    @Body() dto: CreateDashboardAnalyticsEntryDto,
    @Query('clubId') clubId?: string,
  ) {
    const clubIdFromHeader = req.headers['x-club-id'] as string | undefined;
    return this.dashboards.createAnalytics(req.user.sub, clubIdFromHeader || clubId, dto);
  }
}
