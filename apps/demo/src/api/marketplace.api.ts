import { http } from "./http";

export type MarketplaceBrowseQuery = {
  search?: string;
  position?: string;
  sortBy?: "createdAt" | "salary" | "name";
  sortDir?: "asc" | "desc";
  limit?: number;
};

export type MarketplacePublicListing = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  headline: string;
  bio: string | null;
  positions: string[];
  nationality: string | null;
  expectedSalary: number | null;
  openToOffers: boolean;
  createdAt: string;
  offerCount: number;
};

export type MarketplaceListingsResponse = {
  count: number;
  limit: number;
  availablePositions: string[];
  listings: MarketplacePublicListing[];
};

export type MyMarketplaceListingResponse = {
  hasClubMembership: boolean;
  listing:
    | {
        id: string;
        userId: string;
        headline: string;
        bio?: string | null;
        positions: string[];
        nationality?: string | null;
        expectedSalary?: number | null;
        openToOffers: boolean;
        status: "ACTIVE" | "HIRED" | "CLOSED";
        hiredClubId?: string | null;
        hiredAt?: string | null;
      }
    | null;
};

export type MyMarketplaceOffer = {
  id: string;
  message: string;
  offeredSalary?: number | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  createdAt: string;
  respondedAt?: string | null;
  recruiter: { id: string; email: string; fullName?: string | null };
  recruiterClub: { id: string; name: string; slug: string };
};

export type MyMarketplaceOffersResponse = {
  listing: {
    id: string;
    status: "ACTIVE" | "HIRED" | "CLOSED";
    openToOffers: boolean;
    headline: string;
  } | null;
  offers: MyMarketplaceOffer[];
};

export type RecruiterOffer = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  message: string;
  offeredSalary?: number | null;
  createdAt: string;
  respondedAt?: string | null;
  listing: {
    id: string;
    headline: string;
    player: { id: string; email: string; fullName?: string | null } | null;
  };
  recruiterClub: { id: string; name: string; slug: string };
};

export type RecruiterOffersResponse = {
  offers: RecruiterOffer[];
};

export type UpsertMyListingPayload = {
  headline: string;
  bio?: string;
  positions?: string[];
  nationality?: string;
  expectedSalary?: number;
  openToOffers?: boolean;
};

export type SendMarketplaceOfferPayload = {
  clubId: string;
  message: string;
  offeredSalary?: number;
};

export async function getMarketplaceListings(
  query: MarketplaceBrowseQuery = {}
): Promise<MarketplaceListingsResponse> {
  const { data } = await http.get<MarketplaceListingsResponse>("/marketplace/listings", {
    params: query,
  });
  return data;
}

export async function getMyMarketplaceListing(): Promise<MyMarketplaceListingResponse> {
  const { data } = await http.get<MyMarketplaceListingResponse>("/marketplace/me/listing");
  return data;
}

export async function upsertMyMarketplaceListing(payload: UpsertMyListingPayload) {
  const { data } = await http.post("/marketplace/me/listing", payload);
  return data;
}

export async function getMyMarketplaceOffers(): Promise<MyMarketplaceOffersResponse> {
  const { data } = await http.get<MyMarketplaceOffersResponse>("/marketplace/me/offers");
  return data;
}

export async function sendMarketplaceOffer(
  listingId: string,
  payload: SendMarketplaceOfferPayload
) {
  const { data } = await http.post(`/marketplace/listings/${listingId}/offers`, payload);
  return data;
}

export async function getRecruiterMarketplaceOffers(clubId?: string): Promise<RecruiterOffersResponse> {
  const { data } = await http.get<RecruiterOffersResponse>("/marketplace/recruiter/offers", {
    params: clubId ? { clubId } : undefined,
  });
  return data;
}

export async function acceptMarketplaceOffer(offerId: string) {
  const { data } = await http.post(`/marketplace/offers/${offerId}/accept`);
  return data;
}

export async function rejectMarketplaceOffer(offerId: string) {
  const { data } = await http.post(`/marketplace/offers/${offerId}/reject`);
  return data;
}

