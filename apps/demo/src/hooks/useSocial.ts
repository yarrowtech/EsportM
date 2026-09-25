import { useQuery } from "@tanstack/react-query";
import { getSocialFeed } from "../api/social.api";

export function useSocialFeed(limit = 20) {
  return useQuery({
    queryKey: ["social", "feed", limit],
    queryFn: () => getSocialFeed(limit),
  });
}
