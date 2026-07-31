import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClubsModule } from './modules/clubs/clubs.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DebugController } from './debug.controller';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { SquadsModule } from './modules/squads/squads.module';
import { PlayersModule } from './modules/players/players.module';
import { MatchesModule } from './modules/matches/matches.module';
import { StatsModule } from './modules/stats/stats.module';
import { SeasonsModule } from './modules/seasons/seasons.module';
import { LeaderboardsModule } from './modules/leaderboards/leaderboards.module';
import { OpponentsModule } from './modules/opponents/opponents.module';
import { InjuriesModule } from './modules/injuries/injuries.module';
import { DashboardsModule } from "./modules/dashboards/dashboards.module";
import { OperationsModule } from './modules/operations/operations.module';
import { AuthorizationModule } from './common/authorization.module';
import { PlatformModule } from './modules/platform/platform.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { SocialModule } from './modules/social/social.module';
import { AiModule } from './modules/ai/ai.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { BillingModule } from './modules/billing/billing.module';
import { PricingModule } from './common/pricing/pricing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    PricingModule,
    PrismaModule,
    AuthorizationModule,
    UsersModule,
    AuthModule,
    ClubsModule,
    InvitationsModule,
    SquadsModule,
    PlayersModule,
    MatchesModule,
    StatsModule,
    SeasonsModule,
    LeaderboardsModule,
    OpponentsModule,
    InjuriesModule,
    DashboardsModule,
    OperationsModule,
    PlatformModule,
    MarketplaceModule,
    SocialModule,
    AiModule,
    ScheduleModule,
    NotificationModule,
    BillingModule,
  ],
  controllers: [AppController, DebugController],
  providers: [AppService],
})
export class AppModule {}
