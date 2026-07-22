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
import { ClubsService } from './clubs.service';
import {
  AssignSignupDto,
  CreateClubDto,
  InviteMemberDto,
  PendingSignupsQueryDto,
  UpdateClubLogoDto,
  UpdateClubThemeDto,
  UpdateMemberRoleDto,
} from './dto';

import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@UseGuards(JwtAuthGuard)
@Controller('clubs')
export class ClubsController {
  constructor(private clubs: ClubsService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateClubDto) {
    const userId = req.user?.sub;
    const club = await this.clubs.createClub(userId, dto);
    return { club };
  }

  @Get('my')
  async my(@Req() req: any) {
    const userId = req.user?.sub;
    const clubs = await this.clubs.getMyClubs(userId);
    return { clubs };
  }

  @Get(':clubId')
  async one(@Req() req: any, @Param('clubId') clubId: string) {
    const userId = req.user?.sub;
    const club = await this.clubs.getClubById(userId, clubId);
    return { club };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('membership.self.read')
  @Get(':clubId/theme')
  async theme(@Req() req: any, @Param('clubId') clubId: string) {
    const userId = req.user?.sub;
    const theme = await this.clubs.getClubTheme(userId, clubId);
    return { theme };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('members.update.primary')
  @Patch(':clubId/theme')
  async updateTheme(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Body() dto: UpdateClubThemeDto,
  ) {
    const userId = req.user?.sub;
    const theme = await this.clubs.updateClubTheme(userId, clubId, dto);
    return { theme };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('members.update.primary')
  @Post(':clubId/logo/signature')
  async logoSignature(@Req() req: any, @Param('clubId') clubId: string) {
    const userId = req.user?.sub;
    return this.clubs.createClubLogoUploadSignature(userId, clubId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('members.update.primary')
  @Patch(':clubId/logo')
  async updateLogo(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Body() dto: UpdateClubLogoDto,
  ) {
    const userId = req.user?.sub;
    const club = await this.clubs.updateClubLogo(userId, clubId, dto);
    return { club };
  }

  // Invite (permission-scoped)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('invitations.create')
  @Post(':clubId/invite')
  async invite(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Body() dto: InviteMemberDto,
  ) {
    const adminUserId = req.user?.sub;
    const result = await this.clubs.inviteMember(adminUserId, clubId, dto);
    return result;
  }

  // Management-system flow: admin sees newly signed-up users without club membership.
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('members.assign.signup')
  @Get(':clubId/signups/pending')
  async pendingSignups(
    @Param('clubId') clubId: string,
    @Query() query: PendingSignupsQueryDto,
  ) {
    return this.clubs.listPendingSignups(clubId, query);
  }

  // Management-system flow: assign role by userId (no email link sharing required).
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('members.assign.signup')
  @Post(':clubId/signups/assign')
  async assignSignup(
    @Req() req: any,
    @Param('clubId') clubId: string,
    @Body() dto: AssignSignupDto,
  ) {
    const adminUserId = req.user?.sub;
    const assignment = await this.clubs.assignSignupByUserId(
      adminUserId,
      clubId,
      dto,
    );
    return { assignment };
  }


  // List members with permission check.
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('members.read')
  @Get(':clubId/members')
  async members(@Param('clubId') clubId: string) {
    const members = await this.clubs.listMembers(clubId);
    return { members };
  }

  // Update member role with permission checks.
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('members.update.primary', 'members.update.subroles')
  @Patch(':clubId/members/:userId')
  async updateMemberRole(
    @Param('clubId') clubId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    const member = await this.clubs.updateMemberRole(clubId, userId, dto);
    return { member };
  }

  // Remove member with permission check.
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('members.remove')
  @Delete(':clubId/members/:userId')
  async removeMember(
    @Param('clubId') clubId: string,
    @Param('userId') userId: string,
  ) {
    await this.clubs.removeMember(clubId, userId);
    return { ok: true };
  }
}


