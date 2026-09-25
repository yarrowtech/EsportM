import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getClubTheme, getMe, updateClubTheme, type ClubTheme as ApiClubTheme } from "../api/admin.api";

export type ClubTheme = {
  mode: "light" | "dark";
  primary: string;
  deep: string;
};

type ThemeCtx = {
  theme: ClubTheme;
  setTheme: (t: ClubTheme) => void;
  update: (patch: Partial<ClubTheme>) => void;
  canManageClubTheme: boolean;
  isSyncing: boolean;
  syncError: string | null;
  activeClubId: string;
};

export const ThemeContext = createContext<ThemeCtx | null>(null);

const LEGACY_STORAGE_KEY = "esportm_club_theme_v1";
const STORAGE_PREFIX = "esportm_club_theme_v2";

function hexToRgbTuple(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function applyToCssVars(theme: ClubTheme) {
  const root = document.documentElement;

  const [pr, pg, pb] = hexToRgbTuple(theme.primary);
  const [dr, dg, db] = hexToRgbTuple(theme.deep);

  root.style.setProperty("--primary", `${pr} ${pg} ${pb}`);
  root.style.setProperty("--primary-2", `${dr} ${dg} ${db}`);
  root.style.setProperty("--ring", `${pr} ${pg} ${pb}`);

  root.setAttribute("data-theme", theme.mode === "dark" ? "dark" : "light");
}

export const DEFAULT_THEME: ClubTheme = {
  mode: "light",
  primary: "#FFC840",
  deep: "#141820",
};

function getActiveClubId() {
  return localStorage.getItem("activeClubId") || "";
}

function storageKey(clubId: string) {
  return `${STORAGE_PREFIX}:${clubId || "global"}`;
}

function isHex6(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(String(value || ""));
}

function normalizeTheme(input?: Partial<ClubTheme> | null): ClubTheme {
  const mode = input?.mode === "dark" ? "dark" : "light";
  const primary = isHex6(String(input?.primary || "")) ? String(input?.primary) : DEFAULT_THEME.primary;
  const deep = isHex6(String(input?.deep || "")) ? String(input?.deep) : DEFAULT_THEME.deep;
  return { mode, primary, deep };
}

function readStoredTheme(clubId: string): ClubTheme | null {
  try {
    const scopedRaw = localStorage.getItem(storageKey(clubId));
    if (scopedRaw) return normalizeTheme(JSON.parse(scopedRaw));

    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) return normalizeTheme(JSON.parse(legacyRaw));
    return null;
  } catch {
    return null;
  }
}

function membershipsFromMe(me: any) {
  if (Array.isArray(me?.memberships)) return me.memberships;
  if (Array.isArray(me?.user?.memberships)) return me.user.memberships;
  return [];
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeClubId, setActiveClubId] = useState<string>(() => getActiveClubId());
  const [theme, setTheme] = useState<ClubTheme>(() => readStoredTheme(getActiveClubId()) || DEFAULT_THEME);
  const [canManageClubTheme, setCanManageClubTheme] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const saveTimerRef = useRef<number | null>(null);
  const pendingSyncRef = useRef<{ clubId: string; theme: ClubTheme } | null>(null);

  useEffect(() => {
    const syncClubId = () => {
      const next = getActiveClubId();
      setActiveClubId((prev) => (prev === next ? prev : next));
    };

    syncClubId();
    const timer = window.setInterval(syncClubId, 500);
    window.addEventListener("storage", syncClubId);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", syncClubId);
    };
  }, []);

  useEffect(() => {
    let alive = true;

    const cached = readStoredTheme(activeClubId);
    if (cached) setTheme(cached);

    if (!activeClubId) {
      setCanManageClubTheme(false);
      setSyncError(null);
      return () => {
        alive = false;
      };
    }

    void (async () => {
      try {
        const [remoteTheme, me] = await Promise.all([getClubTheme(activeClubId), getMe()]);
        if (!alive) return;

        const normalized = normalizeTheme(remoteTheme as ApiClubTheme);
        setTheme(normalized);

        const memberships = membershipsFromMe(me);
        const active =
          memberships.find((m: any) => m?.clubId === activeClubId) ||
          me?.activeMembership ||
          memberships[0] ||
          null;
        const primary = String(active?.primary || "").toUpperCase();
        setCanManageClubTheme(primary === "ADMIN");
        setSyncError(null);
      } catch (error: any) {
        if (!alive) return;
        const message =
          error?.response?.data?.message || error?.message || "Unable to load club theme.";
        setSyncError(message);
        setCanManageClubTheme(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [activeClubId]);

  useEffect(() => {
    applyToCssVars(theme);
    try {
      localStorage.setItem(storageKey(activeClubId), JSON.stringify(theme));
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(theme));
    } catch {
      // ignore storage quota or parse errors
    }
  }, [activeClubId, theme]);

  const flushThemeSync = useCallback(() => {
    if (!pendingSyncRef.current) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);

    saveTimerRef.current = window.setTimeout(async () => {
      const pending = pendingSyncRef.current;
      if (!pending) return;
      pendingSyncRef.current = null;

      try {
        setIsSyncing(true);
        setSyncError(null);
        const saved = await updateClubTheme(pending.clubId, {
          primary: pending.theme.primary,
          deep: pending.theme.deep,
        });
        setTheme((prev) => normalizeTheme({ ...prev, ...saved }));
      } catch (error: any) {
        const message =
          error?.response?.data?.message || error?.message || "Failed to save club theme.";
        setSyncError(message);
      } finally {
        setIsSyncing(false);
      }
    }, 220);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  const update = useCallback(
    (patch: Partial<ClubTheme>) => {
      setTheme((prev) => {
        if (activeClubId && !canManageClubTheme) {
          return prev;
        }

        const next = normalizeTheme({ ...prev, ...patch });
        if (activeClubId && canManageClubTheme) {
          pendingSyncRef.current = { clubId: activeClubId, theme: next };
          flushThemeSync();
        }
        return next;
      });
    },
    [activeClubId, canManageClubTheme, flushThemeSync]
  );

  const value = useMemo<ThemeCtx>(() => {
    return {
      theme,
      setTheme,
      update,
      canManageClubTheme,
      isSyncing,
      syncError,
      activeClubId,
    };
  }, [activeClubId, canManageClubTheme, isSyncing, syncError, theme, update]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
