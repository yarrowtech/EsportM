import { useEffect, useMemo, useState } from "react";
import { DEFAULT_THEME } from "../../../theme/ThemeProvider";
import { useTheme } from "../../../theme/useTheme";
import { useMe } from "../../../hooks/useMe";
import {
  DotTag,
  Hero,
  PageWrap,
  Section,
  Stat,
  adminCardBorder,
  formatDateTime,
} from "../../admin/admin-ui";

type Membership = {
  clubId: string;
  primary: string;
  subRoles: string[];
  club?: {
    id: string;
    name: string;
    slug: string;
  };
};

type MeData = {
  user?: {
    id?: string;
    email?: string;
    fullName?: string | null;
    createdAt?: string;
  };
  memberships?: Membership[];
  activeClubId?: string | null;
  activeMembership?: Membership | null;
};

const preferenceDefinitions = [
  {
    key: "prefersCompactDensity",
    label: "Compact density",
    description: "Tighten padding on cards and tables so you can scan more rows at once.",
    defaultValue: false,
  },
  {
    key: "prefersReducedMotion",
    label: "Soft motion",
    description: "Calm down transitions and animations during long monitoring sessions.",
    defaultValue: false,
  },
  {
    key: "prefersGuidedInsights",
    label: "Guided insights",
    description: "Show contextual nudges when you visit a screen for the first time.",
    defaultValue: true,
  },
  {
    key: "prefersDesktopNotifications",
    label: "Desktop notifications",
    description: "Keep receiving key alerts even when the dashboard is running in the background.",
    defaultValue: true,
  },
] as const;

type PreferenceDefinition = (typeof preferenceDefinitions)[number];
type PreferenceKey = PreferenceDefinition["key"];
type PreferenceState = Record<PreferenceKey, boolean>;

const PREFERENCE_STORAGE_KEY = "esportm_dashboard_preferences_v1";

function buildDefaultPreferences(): PreferenceState {
  return preferenceDefinitions.reduce((acc, item) => {
    acc[item.key] = item.defaultValue;
    return acc;
  }, {} as PreferenceState);
}

export default function SettingsPage() {
  const meQuery = useMe();
  const data = (meQuery.data || {}) as MeData;
  const { theme, update, canManageClubTheme, isSyncing, syncError, activeClubId } = useTheme();

  const [preferences, setPreferences] = useState<PreferenceState>(() => buildDefaultPreferences());
  const [prefsReady, setPrefsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      setPrefsReady(true);
      return;
    }
    const stored = window.localStorage.getItem(PREFERENCE_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setPreferences((prev) => ({ ...prev, ...parsed }));
        }
      } catch {
        // malformed payload, ignore
      }
    }
    setPrefsReady(true);
  }, []);

  useEffect(() => {
    if (!prefsReady || typeof window === "undefined") return;
    window.localStorage.setItem(PREFERENCE_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences, prefsReady]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset.compactDensity = preferences.prefersCompactDensity ? "dense" : "default";
    root.dataset.reducedMotion = preferences.prefersReducedMotion ? "reduce" : "auto";
  }, [preferences.prefersCompactDensity, preferences.prefersReducedMotion]);

  const memberships = useMemo(() => data.memberships || [], [data.memberships]);
  const localActiveClubId =
    typeof window === "undefined" ? null : localStorage.getItem("activeClubId");
  const activeClubIdDisplay = data.activeClubId || localActiveClubId || "-";

  const currentMembership = useMemo(() => {
    const targetId = data.activeClubId || localActiveClubId || "";
    return memberships.find((membership) => membership.clubId === targetId);
  }, [memberships, data.activeClubId, localActiveClubId]);

  const roleMismatch = Boolean(data.activeClubId && localActiveClubId && data.activeClubId !== localActiveClubId);

  const activeClubStatValue =
    activeClubIdDisplay && activeClubIdDisplay !== "-" ? (
      <span className="inline-block max-w-full break-all font-mono text-xs leading-5">
        {activeClubIdDisplay}
      </span>
    ) : (
      "-"
    );

  const lockedTheme = !activeClubId || !canManageClubTheme;

  const themeStatusMessage = lockedTheme
    ? activeClubId
      ? "Club admin controls the palette."
      : "Activate or join a club to manage the shared theme."
    : isSyncing
    ? "Saving palette..."
    : "Live for every member of the selected club.";

  const handleTogglePreference = (key: PreferenceKey) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleResetPalette = () => {
    update(DEFAULT_THEME);
  };

  if (meQuery.isLoading) {
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
        title="Account Settings"
        subtitle="Profile, role context, and workspace preferences."
        right={<DotTag>SETTINGS</DotTag>}
      />

      {meQuery.isError && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm font-semibold text-rose-700"
          style={{ borderColor: adminCardBorder, background: "rgba(255,255,255,.65)" }}
        >
          Unable to load account settings.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Memberships" value={memberships.length} />
        <Stat label="Active Club ID" value={activeClubStatValue} />
        <Stat
          label="Primary Role"
          value={currentMembership?.primary || data.activeMembership?.primary || "-"}
        />
        <Stat
          label="Sub Roles"
          value={(currentMembership?.subRoles || data.activeMembership?.subRoles || []).length}
        />
        <Stat label="Context Sync" value={roleMismatch ? "Mismatch" : "Synced"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section title="Profile Identity" subtitle="Signed-in account identity." className="xl:col-span-5">
          <Line label="Full Name" value={data.user?.fullName || "-"} />
          <Line label="Email" value={data.user?.email || "-"} />
          <Line label="User ID" value={data.user?.id || "-"} mono />
          <Line label="Created" value={formatDateTime(data.user?.createdAt)} />
        </Section>

        <Section
          title="Role Context"
          subtitle="Active role resolution in the chosen club."
          className="xl:col-span-7"
          dark
        >
          <LineDark label="Server activeClubId" value={data.activeClubId || "-"} />
          <LineDark label="Local activeClubId" value={localActiveClubId || "-"} />
          <LineDark
            label="Current primary"
            value={currentMembership?.primary || data.activeMembership?.primary || "-"}
          />
          <LineDark
            label="Current sub roles"
            value={(currentMembership?.subRoles || data.activeMembership?.subRoles || []).join(", ") || "-"}
          />
          {roleMismatch && (
            <p className="mt-2 text-xs font-semibold text-[rgba(var(--primary),.92)]">
              Active club mismatch detected. Refresh after selecting the intended club.
            </p>
          )}
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section
          title="Workspace Controls"
          subtitle="Preferences that stay with you across sessions."
          className="xl:col-span-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {preferenceDefinitions.map((pref) => (
              <PreferenceToggle
                key={pref.key}
                label={pref.label}
                description={pref.description}
                value={preferences[pref.key]}
                onChange={() => handleTogglePreference(pref.key)}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-[rgb(var(--muted))]">
            Preferences persist in your browser and can enhance mobile or kiosk experiences.
          </p>
        </Section>

        <Section
          title="Club Theme"
          subtitle="Brand palette managed for the active club."
          className="xl:col-span-7"
        >
          <div className="space-y-3">
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm"
              style={{ borderColor: adminCardBorder }}
            >
              <div>
                <p className="font-semibold text-[rgb(var(--text))]">Shared palette</p>
                <p className="text-xs text-[rgb(var(--muted))]">{themeStatusMessage}</p>
              </div>
              <div className="flex items-center gap-2">
                <DotTag tone={lockedTheme ? "warn" : "ok"}>
                  {lockedTheme ? "Locked" : "Live"}
                </DotTag>
                {isSyncing && <DotTag tone="ok">Saving</DotTag>}
              </div>
            </div>

            {syncError && (
              <div
                className="rounded-2xl border px-3 py-2 text-xs font-semibold text-rose-700"
                style={{ borderColor: adminCardBorder }}
              >
                {syncError}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <ColorPicker
                label="Primary color"
                value={theme.primary}
                onChange={(value) => update({ primary: value })}
                disabled={lockedTheme}
              />
              <ColorPicker
                label="Accent / deep"
                value={theme.deep}
                onChange={(value) => update({ deep: value })}
                disabled={lockedTheme}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleResetPalette}
                disabled={lockedTheme}
                className="rounded-full border px-4 py-2 text-xs font-semibold text-[rgb(var(--text))] transition hover:border-[rgb(var(--primary))]"
                style={{ borderColor: adminCardBorder }}
              >
                Reset palette
              </button>
            </div>

            <div
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor: adminCardBorder,
                background: `linear-gradient(145deg, ${theme.primary} 0%, ${theme.deep} 100%)`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Preview</p>
              <p className="mt-1 text-sm font-extrabold text-white">
                {theme.primary} → {theme.deep}
              </p>
              <p className="text-xs text-white/80">
                Use your club&apos;s jersey or identity colors so the dashboard feels custom.
              </p>
            </div>
          </div>
        </Section>
      </div>

      <Section title="Membership Directory" subtitle="All clubs and access roles linked to this account.">
        {!memberships.length ? (
          <p className="text-sm text-[rgb(var(--muted))]">No memberships found.</p>
        ) : (
          <div className="space-y-3">
            {memberships.map((membership) => (
              <article
                key={`${membership.clubId}-${membership.primary}`}
                className="rounded-2xl border bg-white/72 px-3 py-3"
                style={{ borderColor: adminCardBorder }}
              >
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[rgb(var(--text))]">
                    {membership.club?.name || membership.clubId}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <DotTag>{membership.primary}</DotTag>
                    <DotTag tone={membership.subRoles.length ? "warn" : "default"}>
                      {membership.subRoles.length ? membership.subRoles.join(", ") : "No sub roles"}
                    </DotTag>
                  </div>
                </div>
                <p className="text-xs text-[rgb(var(--muted))] [overflow-wrap:anywhere]">
                  Club ID: {membership.clubId} | Slug: {membership.club?.slug || "-"}
                </p>
              </article>
            ))}
          </div>
        )}
      </Section>
    </PageWrap>
  );
}

function PreferenceToggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: () => void;
}) {
  const knobClasses = [
    "ml-1 h-5 w-5 rounded-full bg-white shadow transition",
    value ? "translate-x-5" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label
      className="flex cursor-pointer flex-col rounded-2xl border px-4 py-3 transition hover:border-[rgb(var(--primary))]"
      style={{ borderColor: adminCardBorder }}
    >
      <div>
        <p className="text-sm font-semibold text-[rgb(var(--text))]">{label}</p>
        <p className="text-xs text-[rgb(var(--muted))]">{description}</p>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[rgb(var(--muted))]">
          {value ? "Enabled" : "Off"}
        </span>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={value}
            onChange={() => onChange()}
            aria-checked={value}
          />
          <span
            className="inline-flex h-7 w-12 items-center rounded-full border bg-white/80 shadow-sm transition peer-checked:border-transparent peer-checked:bg-gradient-to-r peer-checked:from-[rgb(var(--primary))] peer-checked:to-[rgb(var(--primary-2))]"
            style={{ borderColor: "rgb(var(--border) / .14)" }}
          >
            <span className={knobClasses} />
          </span>
        </div>
      </div>
    </label>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (newValue: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2 rounded-2xl border px-3 py-2" style={{ borderColor: adminCardBorder }}>
      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[rgb(var(--muted))]">
        {label}
      </span>
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-10 w-full cursor-pointer rounded-xl border border-transparent p-1 transition disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

function Line({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="mb-2 rounded-2xl border bg-white/72 px-3 py-3" style={{ borderColor: adminCardBorder }}>
      <p className="text-xs text-[rgb(var(--muted))]">{label}</p>
      <p
        className={
          mono
            ? "font-mono text-xs text-[rgb(var(--text))] break-all leading-5"
            : "text-sm font-semibold text-[rgb(var(--text))] [overflow-wrap:anywhere]"
        }
      >
        {value}
      </p>
    </div>
  );
}

function LineDark({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 rounded-2xl border border-white/15 bg-white/5 px-3 py-3">
      <p className="text-xs text-white/60">{label}</p>
      <p className="text-sm font-semibold text-white [overflow-wrap:anywhere]">{value}</p>
    </div>
  );
}
