import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import {
  CreateMarketplaceOfferDto,
  MarketplaceBrowseQueryDto,
  UpsertMarketplaceListingDto,
} from './dto';
import { MarketplaceService } from './marketplace.service';
import { PaidFeatureGuard } from '../../common/pricing/paid-feature.guard';
import { RequiresPaidFeature } from '../../common/pricing/requires-paid-feature.decorator';

@Controller('marketplace')
@UseGuards(JwtAuthGuard)
export class MarketplaceController {
  constructor(private marketplace: MarketplaceService) {}

  @Get('listings')
  listings(@Req() req: any, @Query() query: MarketplaceBrowseQueryDto) {
    return this.marketplace.listings(req.user.sub, query);
  }

  @Get('me/listing')
  myListing(@Req() req: any) {
    return this.marketplace.myListing(req.user.sub);
  }

  @Post('me/listing')
  @UseGuards(JwtAuthGuard, PaidFeatureGuard)
  @RequiresPaidFeature('marketplace_recruiting')
  upsertMyListing(@Req() req: any, @Body() dto: UpsertMarketplaceListingDto) {
    return this.marketplace.upsertMyListing(req.user.sub, dto);
  }

  @Get('me/offers')
  myOffers(@Req() req: any) {
    return this.marketplace.myOffers(req.user.sub);
  }

  @Post('listings/:listingId/offers')
  @UseGuards(JwtAuthGuard, PaidFeatureGuard)
  @RequiresPaidFeature('marketplace_recruiting')
  sendOffer(
    @Req() req: any,
    @Param('listingId') listingId: string,
    @Body() dto: CreateMarketplaceOfferDto,
  ) {
    return this.marketplace.sendOffer(req.user.sub, listingId, dto);
  }

  @Get('recruiter/offers')
  @UseGuards(JwtAuthGuard, PaidFeatureGuard)
  @RequiresPaidFeature('marketplace_recruiting')
  recruiterOffers(@Req() req: any, @Query('clubId') clubId?: string) {
    return this.marketplace.recruiterOffers(req.user.sub, clubId);
  }

  @Post('offers/:offerId/accept')
  acceptOffer(@Req() req: any, @Param('offerId') offerId: string) {
    return this.marketplace.acceptOffer(req.user.sub, offerId);
  }

  @Post('offers/:offerId/reject')
  rejectOffer(@Req() req: any, @Param('offerId') offerId: string) {
    return this.marketplace.rejectOffer(req.user.sub, offerId);
  }
}
