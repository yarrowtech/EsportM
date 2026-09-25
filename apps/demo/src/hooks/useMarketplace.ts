import { useQuery } from "@tanstack/react-query";
import {
  getMarketplaceListings,
  getMyMarketplaceListing,
  getMyMarketplaceOffers,
  getRecruiterMarketplaceOffers,
  type MarketplaceBrowseQuery,
} from "../api/marketplace.api";

export function useMarketplaceListings(query: MarketplaceBrowseQuery, enabled = true) {
  return useQuery({
    queryKey: ["marketplace", "listings", query],
    queryFn: () => getMarketplaceListings(query),
    enabled,
  });
}

export function useMyMarketplaceListing(enabled = true) {
  return useQuery({
    queryKey: ["marketplace", "me", "listing"],
    queryFn: getMyMarketplaceListing,
    enabled,
  });
}

export function useMyMarketplaceOffers(enabled = true) {
  return useQuery({
    queryKey: ["marketplace", "me", "offers"],
    queryFn: getMyMarketplaceOffers,
    enabled,
  });
}

export function useRecruiterMarketplaceOffers(clubId?: string, enabled = true) {
  return useQuery({
    queryKey: ["marketplace", "recruiter", "offers", clubId || "ALL"],
    queryFn: () => getRecruiterMarketplaceOffers(clubId),
    enabled,
  });
}

