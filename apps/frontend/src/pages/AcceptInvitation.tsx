import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { acceptInvitation, validateInvitation } from "../api/admin.api";
import { getPasswordRuleStatus, isStrongPassword } from "../utils/passwordPolicy";

type InviteInfo = {
  email: string;
  clubId: string;
  clubName: string;
  primary: "PLAYER" | "ADMIN" | "MANAGER";
  subRoles: string[];
  expiresAt: string;
};

export default function AcceptInvitation() {
  const [sp] = useSearchParams();
  const tokenFromQuery = sp.get("token") || "";

  const [token, setToken] = useState(tokenFromQuery);
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [accepted, setAccepted] = useState(false);
  const trimmedPassword = password.trim();
  const passwordRules = useMemo(
    () => getPasswordRuleStatus(trimmedPassword),
    [trimmedPassword]
  );
  const matchedPasswordRules = passwordRules.filter((rule) => rule.met).length;
  const passwordMeetsPolicy = isStrongPassword(trimmedPassword);

  useEffect(() => {
    setToken(tokenFromQuery);
  }, [tokenFromQuery]);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!token.trim()) {
        setInfo(null);
        return;
      }

      try {
        setValidating(true);
        setMsg(null);
        const res = await validateInvitation(token.trim());
        if (!alive) return;
        setInfo(res.invitation as InviteInfo);
      } catch (e: any) {
        if (!alive) return;
        setInfo(null);
        setMsg({
          type: "err",
          text: e?.response?.data?.message || e?.message || "Invitation is invalid or expired.",
        });
      } finally {
        if (alive) setValidating(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [token]);

  const canSubmit = useMemo(() => {
    return (
      token.trim().length > 8 &&
      fullName.trim().length >= 2 &&
      passwordMeetsPolicy &&
      confirmPassword === password
    );
  }, [token, fullName, passwordMeetsPolicy, confirmPassword, password]);

  const onAccept = async () => {
    setMsg(null);
    if (!canSubmit || loading) return;

    if (!passwordMeetsPolicy) {
      setMsg({ type: "err", text: "Password must match all security requirements." });
      return;
    }

    try {
      setLoading(true);
      await acceptInvitation({
        token: token.trim(),
        fullName: fullName.trim(),
        password: trimmedPassword,
      });
      setAccepted(true);
      setMsg({ type: "ok", text: "Invitation accepted. You can now login." });
    } catch (e: any) {
      setMsg({
        type: "err",
        text: e?.response?.data?.message || e?.message || "Failed to accept invitation.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] p-4 sm:p-6">
      <div className="mx-auto mt-8 max-w-2xl rounded-3xl border border-black/15 bg-white/75 p-6 backdrop-blur-xl sm:p-8">
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold text-[rgb(var(--text))]">Accept Club Invitation</h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Join a club using the invitation link or token from your admin.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text))]">Invitation Token</label>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token here"
              className="w-full rounded-xl border border-black/15 bg-white/85 px-3 py-2 text-sm outline-none"
            />
          </div>

          {validating && (
            <div className="rounded-xl border border-black/15 bg-white/70 px-3 py-2 text-sm">Validating token...</div>
          )}

          {info && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
              <div className="font-semibold">Invitation is valid</div>
              <div className="mt-1">Email: {info.email}</div>
              <div>Club: {info.clubName}</div>
              <div>Role: {info.primary}</div>
              <div>Expires: {new Date(info.expiresAt).toLocaleString()}</div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text))]">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-xl border border-black/15 bg-white/85 px-3 py-2 text-sm outline-none"
              disabled={accepted}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text))]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-xl border border-black/15 bg-white/85 px-3 py-2 text-sm outline-none"
              disabled={accepted}
            />
          </div>

          <div className="rounded-xl border border-black/10 bg-white/70 px-3 py-2">
            <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px] font-bold text-[rgb(var(--text))]">
              <span>Password strength</span>
              <span>
                {matchedPasswordRules}/{passwordRules.length} matched
              </span>
            </div>
            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-black/10" aria-hidden="true">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${(matchedPasswordRules / passwordRules.length) * 100}%` }}
              />
            </div>
            <ul className="flex flex-wrap gap-1.5 text-[11px] leading-none">
              {passwordRules.map((rule) => (
                <li
                  key={rule.id}
                  className={`flex h-5 items-center gap-1.5 rounded-full border px-2 ${
                    rule.met ? "text-emerald-700" : "text-[rgb(var(--muted))]"
                  } ${rule.met ? "border-emerald-500/25 bg-emerald-500/10" : "border-black/10 bg-white/60"}`}
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      rule.met
                        ? "bg-emerald-500"
                        : "bg-black/20"
                    }`}
                  />
                  {rule.shortLabel}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text))]">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full rounded-xl border border-black/15 bg-white/85 px-3 py-2 text-sm outline-none"
              disabled={accepted}
            />
          </div>

          {msg && (
            <div
              className={`rounded-xl border px-3 py-2 text-sm ${
                msg.type === "ok"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              {msg.text}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={onAccept}
              disabled={!canSubmit || loading || accepted}
              className="rounded-xl px-4 py-2 text-sm font-extrabold transition disabled:opacity-60"
              style={{
                background: "rgb(var(--primary))",
                color: "rgb(var(--primary-2))",
                border: "1px solid rgba(0,0,0,.15)",
              }}
            >
              {loading ? "Accepting..." : "Accept Invitation"}
            </button>

            <Link
              to="/login"
              className="rounded-xl border border-black/15 bg-white/80 px-4 py-2 text-sm font-semibold hover:bg-white"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
