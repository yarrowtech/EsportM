import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getMe, getMyClubs, type MeUser } from "../../api/admin.api";
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
} from "./admin-ui";

type Ctx = {
  clubId: string;
};

function messageOf(e: unknown, fallback: string) {
  const err = e as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message || err?.message || fallback;
}

export default function AdminSettings() {
  const ctx = (useOutletContext() as Ctx) || ({} as Ctx);
  const clubId = ctx.clubId;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [user, setUser] = useState<MeUser | null>(null);
  const [clubCount, setClubCount] = useState(0);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const [me, clubs] = await Promise.all([getMe(), getMyClubs()]);
        if (!alive) return;
        setUser(me.user);
        setClubCount(clubs.length);
      } catch (e: unknown) {
        if (!alive) return;
        setErr(messageOf(e, "Failed to load settings data."));
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [clubId]);

  const activeMembership = useMemo(() => {
    return user?.memberships?.find((membership) => membership.club.id === clubId) || null;
  }, [user?.memberships, clubId]);

  if (loading) {
    return (
      <PageWrap>
        <div
          className="rounded-3xl border bg-white/60 px-5 py-6 text-sm font-semibold text-[rgb(var(--muted))]"
          style={{ borderColor: adminCardBorder }}
        >
          Loading settings...
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Hero
        title="Admin Settings"
        subtitle="Account and membership snapshot for current session."
        right={<DotTag>{activeMembership?.primary || "NO ROLE"}</DotTag>}
      />

      {err ? (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          {err}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Total Clubs" value={clubCount} />
        <Stat label="Memberships" value={user?.memberships?.length || 0} />
        <Stat label="Active Club" value={activeMembership?.club.name || "-"} />
        <Stat label="Primary Role" value={activeMembership?.primary || "-"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section title="Account Identity" subtitle="Signed-in user details." className="xl:col-span-5">
          <div className="space-y-3 text-sm">
            <Row label="Full Name" value={user?.fullName || "-"} />
            <Row label="Email" value={user?.email || "-"} />
            <Row label="User ID" value={user?.id || "-"} mono />
            <Row label="Active Club ID" value={clubId || "-"} mono />
          </div>
        </Section>

        <Section title="Active Club Membership" subtitle="Resolved role and role extensions." className="xl:col-span-7" dark>
          {!activeMembership ? (
            <p className="text-sm text-white/75">No active membership found for selected club.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <RowDark label="Club" value={activeMembership.club.name} />
              <RowDark label="Slug" value={activeMembership.club.slug} />
              <RowDark label="Primary" value={activeMembership.primary} />
              <RowDark label="Sub Roles" value={activeMembership.subRoles.join(", ") || "-"} />
            </div>
          )}
        </Section>
      </div>

      <Section title="All Memberships" subtitle="Roles across all clubs attached to this account.">
        {!user?.memberships?.length ? (
          <p className="text-sm text-[rgb(var(--muted))]">No memberships found.</p>
        ) : (
          <div className="space-y-2">
            {user.memberships.map((membership) => (
              <article
                key={`${membership.club.id}-${membership.id}`}
                className="rounded-2xl border bg-white/75 px-3 py-3"
                style={{ borderColor: adminCardBorder }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-[rgb(var(--text))]">{membership.club.name}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">{membership.club.slug}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <DotTag>{membership.primary}</DotTag>
                    <DotTag tone={membership.subRoles.length > 0 ? "warn" : "default"}>
                      {membership.subRoles.length ? membership.subRoles.join(", ") : "No sub role"}
                    </DotTag>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>
    </PageWrap>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border bg-white/75 px-3 py-2" style={{ borderColor: adminCardBorder }}>
      <p className="text-xs text-[rgb(var(--muted))]">{label}</p>
      <p className={mono ? "font-mono text-xs text-[rgb(var(--text))]" : "text-sm font-semibold text-[rgb(var(--text))]"}>
        {value}
      </p>
    </div>
  );
}

function RowDark({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2">
      <p className="text-xs text-white/60">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
