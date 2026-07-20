import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  acceptMarketplaceOffer,
  rejectMarketplaceOffer,
  sendMarketplaceOffer,
  upsertMyMarketplaceListing,
} from "../../api/marketplace.api";
import {
  useMarketplaceListings,
  useMyMarketplaceListing,
  useMyMarketplaceOffers,
  useRecruiterMarketplaceOffers,
} from "../../hooks/useMarketplace";
import { useMe } from "../../hooks/useMe";
import { usePrototypePricing } from "../../features/prototype-pricing/PrototypePricingProvider";
import { PageWrap, formatDateTime } from "../admin/admin-ui";
import "./marketplace.css";

type Membership = {
  clubId: string;
  primary: "ADMIN" | "MANAGER" | "PLAYER" | "MEMBER";
  subRoles?: string[];
  club?: { id: string; name: string; slug: string };
};

type IconName = "home" | "marketplace" | "dashboard";

function Icon({ name }: { name: IconName }) {
  if (name === "home") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 10.5L12 4l7.5 6.5" /><path d="M7 10.5v8h10v-8" /></svg>;
  if (name === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="5" rx="1.5" />
        <rect x="13" y="11" width="7" height="9" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9.5h16v10H4z" />
      <path d="M2.5 9.5L12 4l9.5 5.5" />
      <path d="M9 13.5h6M9 16.5h6" />
    </svg>
  );
}

function canRecruit(membership: Membership) {
  if (!membership) return false;
  if (membership.primary === "ADMIN" || membership.primary === "MANAGER") return true;
  return Array.isArray(membership.subRoles) && membership.subRoles.includes("AGENT");
}

function salary(value?: number | null) {
  if (value == null) return "-";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function messageOf(error: unknown, fallback: string) {
  const typed = error as { response?: { data?: { message?: string } }; message?: string };
  return typed?.response?.data?.message || typed?.message || fallback;
}

function initials(name?: string | null) {
  if (!name) return "PL";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "PL";
}

function pillTone(status: string) {
  if (status === "ACCEPTED" || status === "HIRED") return "mpx-pill mpx-pill-ok";
  if (status === "REJECTED" || status === "WITHDRAWN" || status === "CLOSED") return "mpx-pill mpx-pill-danger";
  if (status === "PENDING") return "mpx-pill mpx-pill-warn";
  return "mpx-pill";
}

export default function MarketplaceModulePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pricing = usePrototypePricing();
  const meQuery = useMe();
  const meData = (meQuery.data || {}) as { memberships?: Membership[] };
  const memberships = Array.isArray(meData.memberships) ? meData.memberships : [];
  const isUnassignedPlayer = memberships.length === 0;
  const recruiterMemberships = memberships.filter(canRecruit);
  const isRecruiter = recruiterMemberships.length > 0;

  const [selectedClubId, setSelectedClubId] = useState("");
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("");

  useEffect(() => {
    if (selectedClubId) return;
    const first = recruiterMemberships[0]?.clubId;
    if (first) setSelectedClubId(first);
  }, [recruiterMemberships, selectedClubId]);

  const listingsQuery = useMarketplaceListings(
    {
      search: search.trim() || undefined,
      position: position || undefined,
      sortBy: "createdAt",
      sortDir: "desc",
      limit: 50,
    },
    true
  );
  const myListingQuery = useMyMarketplaceListing(true);
  const myOffersQuery = useMyMarketplaceOffers(isUnassignedPlayer);
  const recruiterOffersQuery = useRecruiterMarketplaceOffers(selectedClubId || undefined, isRecruiter);

  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [positions, setPositions] = useState("");
  const [nationality, setNationality] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [listingMsg, setListingMsg] = useState("");

  const listingForForm = myListingQuery.data?.listing;
  useEffect(() => {
    const current = listingForForm;
    if (!current) return;
    setHeadline(current.headline || "");
    setBio(String(current.bio || ""));
    setPositions(Array.isArray(current.positions) ? current.positions.join(", ") : "");
    setNationality(String(current.nationality || ""));
    setExpectedSalary(current.expectedSalary != null ? String(current.expectedSalary) : "");
  }, [listingForForm]);

  const [offerTargetId, setOfferTargetId] = useState("");
  const [offerNote, setOfferNote] = useState("");
  const [offerSalary, setOfferSalary] = useState("");
  const [offerMsg, setOfferMsg] = useState("");

  const boardRef = useRef<HTMLElement | null>(null);

  const upsertListingMutation = useMutation({
    mutationFn: upsertMyMarketplaceListing,
    onSuccess: async () => {
      setListingMsg("Listing saved.");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["marketplace", "me", "listing"] }),
        qc.invalidateQueries({ queryKey: ["marketplace", "listings"] }),
      ]);
    },
    onError: (error) => setListingMsg(messageOf(error, "Unable to save listing")),
  });

  const sendOfferMutation = useMutation({
    mutationFn: (payload: { listingId: string; clubId: string; message: string; offeredSalary?: number }) =>
      sendMarketplaceOffer(payload.listingId, {
        clubId: payload.clubId,
        message: payload.message,
        offeredSalary: payload.offeredSalary,
      }),
    onSuccess: async () => {
      setOfferMsg("Offer sent.");
      setOfferTargetId("");
      setOfferNote("");
      setOfferSalary("");
      await qc.invalidateQueries({ queryKey: ["marketplace", "recruiter", "offers"] });
    },
    onError: (error) => setOfferMsg(messageOf(error, "Unable to send offer")),
  });

  const acceptMutation = useMutation({
    mutationFn: (offerId: string) => acceptMarketplaceOffer(offerId),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["marketplace"] }),
        qc.invalidateQueries({ queryKey: ["me"] }),
      ]);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (offerId: string) => rejectMarketplaceOffer(offerId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["marketplace", "me", "offers"] });
    },
  });

  const listings = useMemo(() => listingsQuery.data?.listings || [], [listingsQuery.data?.listings]);
  const listingPositions = useMemo(
    () => listingsQuery.data?.availablePositions || [],
    [listingsQuery.data?.availablePositions]
  );
  const myOffers = useMemo(() => myOffersQuery.data?.offers || [], [myOffersQuery.data?.offers]);
  const recruiterOffers = useMemo(
    () => recruiterOffersQuery.data?.offers || [],
    [recruiterOffersQuery.data?.offers]
  );
  const myListing = myListingQuery.data?.listing;

  const loading =
    meQuery.isLoading ||
    listingsQuery.isLoading ||
    myListingQuery.isLoading ||
    (isUnassignedPlayer && myOffersQuery.isLoading) ||
    (isRecruiter && recruiterOffersQuery.isLoading);

  const activeClubName = useMemo(() => {
    const row = recruiterMemberships.find((item) => item.clubId === selectedClubId);
    return row?.club?.name || row?.clubId || "-";
  }, [recruiterMemberships, selectedClubId]);

  const pendingOfferCount = useMemo(() => {
    if (isUnassignedPlayer) return myOffers.filter((offer) => offer.status === "PENDING").length;
    return recruiterOffers.filter((offer) => offer.status === "PENDING").length;
  }, [isUnassignedPlayer, myOffers, recruiterOffers]);

  const acceptedOfferCount = useMemo(() => {
    if (isUnassignedPlayer) return myOffers.filter((offer) => offer.status === "ACCEPTED").length;
    return recruiterOffers.filter((offer) => offer.status === "ACCEPTED").length;
  }, [isUnassignedPlayer, myOffers, recruiterOffers]);

  const jumpTo = (node: HTMLElement | null) => {
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <PageWrap>
        <div className="mpx-loading">Preparing marketplace workspace...</div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <div className="mpx-ref">
        <div className="mpx-shell">
          <aside className="mpx-rail">
            <button type="button" className="mpx-rail-icon" data-label="Home" onClick={() => navigate("/")} aria-label="Home">
              <Icon name="home" />
            </button>
            <button type="button" className="mpx-rail-icon is-active" data-label="Marketplace" onClick={() => jumpTo(boardRef.current)} aria-label="Marketplace">
              <Icon name="marketplace" />
            </button>
            <button type="button" className="mpx-rail-icon" data-label="Dashboard" onClick={() => navigate("/dashboard")} aria-label="Dashboard">
              <Icon name="dashboard" />
            </button>
          </aside>

          <main className="mpx-canvas">
            <header className="mpx-topbar">
              <div className="mpx-brand">
                <span className="mpx-brand-mark" />
                EsportM
              </div>
              <div className="mpx-active-chip">
                Marketplace
                <b>{pendingOfferCount} pending</b>
              </div>
            </header>

            <section className="mpx-head">
              <div>
                <h1>Marketplace Journeys</h1>
                <p>Player listing, scouting, offer, and hiring stages in one board.</p>
              </div>
              <div className="mpx-people">
                {listings.slice(0, 10).map((row) => (
                  <span key={row.id} title={row.fullName || row.email}>
                    {initials(row.fullName || row.email)}
                  </span>
                ))}
              </div>
            </section>

            <section className="mpx-board" ref={boardRef}>
              <article className="mpx-lane">
                <div className="mpx-lane-head">
                  <h3>Profile Setup</h3>
                </div>

                {isUnassignedPlayer ? (
                  <>
                    <label className="mpx-field"><span>Headline</span><input value={headline} onChange={(event) => setHeadline(event.target.value)} placeholder="Player statement" className="mpx-input" /></label>
                    <div className="mpx-inline-fields">
                      <label className="mpx-field"><span>Expected Salary</span><input value={expectedSalary} onChange={(event) => setExpectedSalary(event.target.value)} className="mpx-input" placeholder="50000" /></label>
                      <label className="mpx-field"><span>Nationality</span><input value={nationality} onChange={(event) => setNationality(event.target.value)} className="mpx-input" placeholder="Country" /></label>
                    </div>
                    <label className="mpx-field"><span>Positions</span><input value={positions} onChange={(event) => setPositions(event.target.value)} className="mpx-input" placeholder="ST, LW" /></label>
                    <label className="mpx-field"><span>Bio</span><textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={3} className="mpx-input mpx-textarea" placeholder="Strengths and current form..." /></label>
                    <div className="mpx-actions">
                      <button
                        type="button"
                        className="mpx-btn mpx-btn-dark"
                        onClick={() =>
                          upsertListingMutation.mutate({
                            headline: headline.trim(),
                            bio: bio.trim() || undefined,
                            positions: positions.split(",").map((item) => item.trim()).filter(Boolean),
                            nationality: nationality.trim() || undefined,
                            expectedSalary: expectedSalary ? Number(expectedSalary) : undefined,
                            openToOffers: true,
                          })
                        }
                        disabled={upsertListingMutation.isPending || !headline.trim()}
                      >
                        {upsertListingMutation.isPending ? "Saving..." : myListing ? "Update Listing" : "Publish Listing"}
                      </button>
                      {myListing ? <span className={pillTone(myListing.status)}>{myListing.status}</span> : null}
                    </div>
                    {listingMsg ? <p className="mpx-msg">{listingMsg}</p> : null}
                  </>
                ) : (
                  <>
                    <p className="mpx-msg">Recruiter mode. Pick the club to send offers from.</p>
                    {isRecruiter ? (
                      <label className="mpx-field">
                        <span>Active Club</span>
                        <select value={selectedClubId} onChange={(event) => setSelectedClubId(event.target.value)} className="mpx-input">
                          {recruiterMemberships.map((row) => (
                            <option key={row.clubId} value={row.clubId}>{row.club?.name || row.clubId}</option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <p className="mpx-msg">No recruiter permission in this account.</p>
                    )}
                  </>
                )}
              </article>

              <article className="mpx-lane">
                <div className="mpx-lane-head">
                  <h3>Scout Pool</h3>
                </div>
                <div className="mpx-lane-list">
                  {listings.slice(0, 6).map((row) => (
                    <div key={row.id} className="mpx-card">
                      <div className="mpx-card-head">
                        <span>{initials(row.fullName || row.email)}</span>
                        <div>
                          <p>{row.fullName || row.email}</p>
                          <small>{row.positions.join(", ") || "N/A"}</small>
                        </div>
                      </div>
                      <p>{row.headline}</p>
                      {isRecruiter ? (
                        <button
                          type="button"
                          className="mpx-btn mpx-btn-light"
                          onClick={() =>
                            pricing.runWithPricingLayer("marketplace_recruiting", () => {
                              setOfferTargetId(row.id);
                              setOfferNote(`Offer from ${activeClubName} for your listing "${row.headline}".`);
                            })
                          }
                        >
                          Prepare Offer
                        </button>
                      ) : null}
                    </div>
                  ))}
                  {!listings.length ? <p className="mpx-msg">No active listings.</p> : null}
                </div>
              </article>

              <article className="mpx-lane">
                <div className="mpx-lane-head">
                  <h3>{isUnassignedPlayer ? "Incoming Offers" : "Offer Responses"}</h3>
                </div>
                <div className="mpx-lane-list">
                  {isUnassignedPlayer
                    ? myOffers.slice(0, 6).map((offer) => (
                        <div key={offer.id} className="mpx-card">
                          <div className="mpx-card-head">
                            <span>{initials(offer.recruiterClub.name)}</span>
                            <div>
                              <p>{offer.recruiterClub.name}</p>
                              <small>{formatDateTime(offer.createdAt)}</small>
                            </div>
                            <span className={pillTone(offer.status)}>{offer.status}</span>
                          </div>
                          <p>{offer.message}</p>
                          <small>Salary: {salary(offer.offeredSalary)}</small>
                          {offer.status === "PENDING" ? (
                            <div className="mpx-actions">
                              <button type="button" className="mpx-btn mpx-btn-ok" onClick={() => acceptMutation.mutate(offer.id)}>Accept</button>
                              <button type="button" className="mpx-btn mpx-btn-danger" onClick={() => rejectMutation.mutate(offer.id)}>Reject</button>
                            </div>
                          ) : null}
                        </div>
                      ))
                    : recruiterOffers.slice(0, 6).map((offer) => (
                        <div key={offer.id} className="mpx-card">
                          <div className="mpx-card-head">
                            <span>{initials(offer.listing.player?.fullName || offer.listing.player?.email)}</span>
                            <div>
                              <p>{offer.listing.player?.fullName || offer.listing.player?.email || "Player"}</p>
                              <small>{formatDateTime(offer.createdAt)}</small>
                            </div>
                            <span className={pillTone(offer.status)}>{offer.status}</span>
                          </div>
                          <p>{offer.message}</p>
                        </div>
                      ))}
                  {isUnassignedPlayer && !myOffers.length ? <p className="mpx-msg">No offers yet.</p> : null}
                  {!isUnassignedPlayer && !recruiterOffers.length ? <p className="mpx-msg">No sent offers yet.</p> : null}
                </div>
              </article>

              <article className="mpx-lane mpx-lane-metrics">
                <div className="mpx-lane-head">
                  <h3>Deal State</h3>
                </div>
                <div className="mpx-metric">
                  <small>Open Listings</small>
                  <strong>{listings.length}</strong>
                </div>
                <div className="mpx-metric">
                  <small>Your Mode</small>
                  <strong>{isUnassignedPlayer ? "Player Listing" : isRecruiter ? "Recruiter" : "Viewer"}</strong>
                </div>
                <div className="mpx-metric">
                  <small>Offers in Queue</small>
                  <strong>{isUnassignedPlayer ? myOffers.length : recruiterOffers.length}</strong>
                </div>
                <div className="mpx-metric">
                  <small>Accepted Deals</small>
                  <strong>{acceptedOfferCount}</strong>
                </div>
              </article>
            </section>

            <section className="mpx-bottom">
              <article className="mpx-panel">
                <div className="mpx-panel-head">
                  <h3>Listing Directory</h3>
                  <div className="mpx-inline-fields">
                    <label className="mpx-field">
                      <span>Search</span>
                      <input value={search} onChange={(event) => setSearch(event.target.value)} className="mpx-input" placeholder="Name or role" />
                    </label>
                    <label className="mpx-field">
                      <span>Position</span>
                      <select value={position} onChange={(event) => setPosition(event.target.value)} className="mpx-input">
                        <option value="">All</option>
                        {listingPositions.map((pos) => <option key={pos} value={pos}>{pos}</option>)}
                      </select>
                    </label>
                  </div>
                </div>

                {offerMsg ? <p className="mpx-msg">{offerMsg}</p> : null}

                <div className="mpx-directory">
                  {listings.map((row) => (
                    <div key={row.id} className="mpx-directory-item">
                      <div className="mpx-card-head">
                        <span>{initials(row.fullName || row.email)}</span>
                        <div>
                          <p>{row.fullName || row.email}</p>
                          <small>{row.email}</small>
                        </div>
                        <small>{salary(row.expectedSalary)}</small>
                      </div>
                      <p>{row.headline}</p>
                      <small>{row.positions.join(", ") || "No position"} | Offers: {row.offerCount}</small>
                      {isRecruiter ? (
                        <button
                          type="button"
                          className="mpx-btn mpx-btn-light"
                          onClick={() =>
                            pricing.runWithPricingLayer("marketplace_recruiting", () => {
                              setOfferTargetId(row.id);
                              setOfferNote(`Offer from ${activeClubName} for your listing "${row.headline}".`);
                            })
                          }
                        >
                          Send Offer
                        </button>
                      ) : null}
                      {isRecruiter && offerTargetId === row.id ? (
                        <div className="mpx-offer-form">
                          <textarea value={offerNote} onChange={(event) => setOfferNote(event.target.value)} className="mpx-input mpx-textarea" rows={3} placeholder="Offer details..." />
                          <input value={offerSalary} onChange={(event) => setOfferSalary(event.target.value)} className="mpx-input" placeholder="Salary (optional)" />
                          <div className="mpx-actions">
                            <button
                              type="button"
                              className="mpx-btn mpx-btn-dark"
                              onClick={() =>
                                pricing.runWithPricingLayer("marketplace_recruiting", () =>
                                  sendOfferMutation.mutate({
                                    listingId: row.id,
                                    clubId: selectedClubId,
                                    message: offerNote.trim(),
                                    offeredSalary: offerSalary ? Number(offerSalary) : undefined,
                                  })
                                )
                              }
                              disabled={sendOfferMutation.isPending || !selectedClubId || !offerNote.trim()}
                            >
                              {sendOfferMutation.isPending ? "Sending..." : "Confirm Offer"}
                            </button>
                            <button type="button" className="mpx-btn mpx-btn-light" onClick={() => setOfferTargetId("")}>Cancel</button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {!listings.length ? <p className="mpx-msg">No listings found.</p> : null}
                </div>
              </article>

              <article className="mpx-panel">
                <h3>{isUnassignedPlayer ? "Offer Timeline" : "Sent Offers"}</h3>
                <div className="mpx-timeline">
                  {isUnassignedPlayer
                    ? myOffers.map((offer) => (
                        <div key={offer.id} className="mpx-timeline-item">
                          <span className={pillTone(offer.status)}>{offer.status}</span>
                          <p>{offer.recruiterClub.name} | {offer.message}</p>
                          <small>{formatDateTime(offer.createdAt)}</small>
                        </div>
                      ))
                    : recruiterOffers.map((offer) => (
                        <div key={offer.id} className="mpx-timeline-item">
                          <span className={pillTone(offer.status)}>{offer.status}</span>
                          <p>{offer.listing.player?.fullName || offer.listing.player?.email || "Player"} | {offer.recruiterClub.name}</p>
                          <small>{formatDateTime(offer.createdAt)}</small>
                        </div>
                      ))}
                  {isUnassignedPlayer && !myOffers.length ? <p className="mpx-msg">No offers yet.</p> : null}
                  {!isUnassignedPlayer && !recruiterOffers.length ? <p className="mpx-msg">No offers sent yet.</p> : null}
                </div>
              </article>
            </section>
          </main>
        </div>
      </div>
    </PageWrap>
  );
}
