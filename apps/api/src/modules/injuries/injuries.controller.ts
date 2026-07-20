import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { InjuriesService } from './injuries.service';
import { CreateInjuryDto, UpdateInjuryDto } from './dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequiresPaidFeature } from '../../common/pricing/requires-paid-feature.decorator';
import { PaidFeatureGuard } from '../../common/pricing/paid-feature.guard';

@UseGuards(JwtAuthGuard, PaidFeatureGuard)
@RequiresPaidFeature('medical_management')
@Controller('clubs/:clubId/injuries')
export class InjuriesController {
  constructor(private injuries: InjuriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('injuries.write')
  create(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Body() dto: CreateInjuryDto,
  ) {
    return this.injuries.create(req.user.sub, clubId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('injuries.read')
  list(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Query('userId') userId?: string,
    @Query('active') active?: string,
  ) {
    const activeOnly =
      active === undefined
        ? undefined
        : ['true', '1', 'yes'].includes(String(active).toLowerCase());
    return this.injuries.list(req.user.sub, clubId, { userId, activeOnly });
  }

  @Get(':injuryId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('injuries.read')
  one(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('injuryId') injuryId: string,
  ) {
    return this.injuries.getOne(req.user.sub, clubId, injuryId);
  }

  @Patch(':injuryId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('injuries.write')
  update(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('injuryId') injuryId: string,
    @Body() dto: UpdateInjuryDto,
  ) {
    return this.injuries.update(req.user.sub, clubId, injuryId, dto);
  }

  @Delete(':injuryId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('injuries.write')
  remove(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Param('injuryId') injuryId: string,
  ) {
    return this.injuries.remove(req.user.sub, clubId, injuryId);
  }
}
