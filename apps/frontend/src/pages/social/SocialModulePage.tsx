import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  Heart,
  MessageCircle,
  PlayCircle,
  Plus,
  Search,
  SendHorizonal,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  createSocialComment,
  createSocialMediaSignature,
  createSocialPost,
  MAX_IMAGE_HEIGHT_PX,
  MAX_IMAGE_WIDTH_PX,
  deleteSocialComment,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_VIDEO_DURATION_SEC,
  MAX_VIDEO_HEIGHT_PX,
  MAX_VIDEO_INPUT_BYTES,
  MAX_VIDEO_UPLOAD_BYTES,
  MAX_VIDEO_WIDTH_PX,
  prepareSocialMediaForUpload,
  toggleSocialLike,
  uploadSocialMediaToCloudinary,
  type SocialFeedPost,
  type SocialRole,
} from "../../api/social.api";
import { useMe } from "../../hooks/useMe";
import { useSocialFeed } from "../../hooks/useSocial";
import { usePrototypePricing } from "../../features/prototype-pricing/PrototypePricingProvider";
import "./social.css";

type FeedFilter = "ALL" | "VIDEO" | "SCOUT_NOTES";

const roleLabel: Record<SocialRole, string> = {
  PLAYER: "Player",
  MANAGER: "Manager",
  ADMIN: "Admin",
  MEMBER: "Member",
  COACH: "Coach",
  PHYSIO: "Physio",
  AGENT: "Agent",
  NUTRITIONIST: "Nutritionist",
  PITCH_MANAGER: "Pitch Manager",
};

function initials(name: string) {
  const pieces = name.trim().split(/\s+/).filter(Boolean);
  const a = pieces[0]?.[0] ?? "P";
  const b = pieces.length > 1 ? pieces[pieces.length - 1]?.[0] : "";
  return `${a}${b}`.toUpperCase();
}

function asErrorMessage(error: unknown, fallback: string) {
  const typed = error as { response?: { data?: { message?: string } }; message?: string };
  return typed?.response?.data?.message || typed?.message || fallback;
}

function formatPostedAt(input?: string) {
  if (!input) return "-";
  const stamp = new Date(input).getTime();
  if (!Number.isFinite(stamp)) return "-";
  const diff = Date.now() - stamp;
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function canPublishFromMe(data: any) {
  const memberships = Array.isArray(data?.memberships) ? data.memberships : [];
  if (!memberships.length) return true;
  return memberships.some(
    (membership: any) => String(membership?.primary || "").toUpperCase() === "PLAYER"
  );
}

export default function SocialModulePage() {
  const qc = useQueryClient();
  const pricing = usePrototypePricing();
  const meQuery = useMe();
  const feedQuery = useSocialFeed(24);

  const meData = (meQuery.data || {}) as any;
  const userId = String(meData?.user?.id || "");
  const canPublish = canPublishFromMe(meData);
  const canUseSocialPublishing = pricing.hasFeatureAccess("social_publishing");

  const [filter, setFilter] = useState<FeedFilter>("ALL");
  const [savedByMe, setSavedByMe] = useState<Record<string, boolean>>({});
  const [draftByPost, setDraftByPost] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composeInfo, setComposeInfo] = useState<string | null>(null);
  const [composeMode, setComposeMode] = useState<"upload" | "instagram">("upload");
  const [composer, setComposer] = useState({
    skill: "",
    caption: "",
    tags: "",
    file: null as File | null,
    instagramUrl: "",
  });
  const igScriptLoaded = useRef(false);

  const posts = useMemo(() => feedQuery.data?.posts || [], [feedQuery.data?.posts]);

  const visiblePosts = useMemo(() => {
    if (filter === "VIDEO") return posts.filter((post) => post.media?.kind === "video");
    if (filter === "SCOUT_NOTES") {
      return posts.filter(
        (post) =>
          post.tags.some((tag) => String(tag).toLowerCase().includes("showcase")) ||
          post.author.role === "COACH" ||
          post.author.role === "MANAGER"
      );
    }
    return posts;
  }, [filter, posts]);

  const featuredAuthors = useMemo(() => {
    const unique = new Map<string, { name: string; role: SocialRole }>();
    posts.forEach((post) => {
      if (!unique.has(post.author.id)) {
        unique.set(post.author.id, {
          name: post.author.fullName,
          role: post.author.role,
        });
      }
    });
    return Array.from(unique.values()).slice(0, 6);
  }, [posts]);

  const trendingTags = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((post) => {
      post.tags.forEach((tag) => {
        const key = String(tag || "").toLowerCase().replace(/^#/, "");
        if (!key) return;
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [posts]);

  const publishMutation = useMutation({
    mutationFn: async () => {
      setComposeError(null);
      setComposeInfo(null);
      const skill = composer.skill.trim();
      const caption = composer.caption.trim();
      const instagramUrl = composer.instagramUrl.trim();
      const file = composer.file;

      if (!skill || !caption) throw new Error("Skill and caption are required");

      const tags = composer.tags
        .split(",")
        .map((item) => item.trim().replace(/^#/, ""))
        .filter(Boolean);

      // Instagram URL mode — no file upload needed
      if (composeMode === "instagram") {
        if (!instagramUrl) throw new Error("Paste an Instagram post URL");
        const igPattern = /^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+\/?/;
        if (!igPattern.test(instagramUrl)) {
          throw new Error("Must be a valid instagram.com/p/, /reel/, or /tv/ URL");
        }
        return createSocialPost({ skill, caption, tags, instagramUrl });
      }

      // Upload mode
      if (!file) throw new Error("Select an image or video first");

      const prepared = await prepareSocialMediaForUpload(file);
      if (prepared.note) setComposeInfo(prepared.note);

      const signature = await createSocialMediaSignature({
        resourceType: prepared.resourceType,
        transformation: prepared.transformation,
      });
      const uploaded = await uploadSocialMediaToCloudinary(prepared.file, signature, (percent) =>
        setUploadProgress(percent)
      );

      if (!uploaded.url || !uploaded.publicId) {
        throw new Error("Upload succeeded but media metadata is incomplete");
      }
      if (uploaded.kind === "image" && typeof uploaded.bytes === "number" && uploaded.bytes > MAX_IMAGE_UPLOAD_BYTES) {
        throw new Error("Image is too large after upload optimization. Max is 8 MB");
      }
      if (uploaded.kind === "video" && typeof uploaded.bytes === "number" && uploaded.bytes > MAX_VIDEO_UPLOAD_BYTES) {
        throw new Error("Video is too large after upload optimization. Max is 80 MB");
      }
      if (
        uploaded.kind === "image" &&
        typeof uploaded.width === "number" &&
        typeof uploaded.height === "number" &&
        (uploaded.width > MAX_IMAGE_WIDTH_PX || uploaded.height > MAX_IMAGE_HEIGHT_PX)
      ) {
        throw new Error(`Image resolution exceeds ${MAX_IMAGE_WIDTH_PX}x${MAX_IMAGE_HEIGHT_PX}`);
      }
      if (
        uploaded.kind === "video" &&
        typeof uploaded.width === "number" &&
        typeof uploaded.height === "number" &&
        (uploaded.width > MAX_VIDEO_WIDTH_PX || uploaded.height > MAX_VIDEO_HEIGHT_PX)
      ) {
        throw new Error(`Video resolution exceeds ${MAX_VIDEO_WIDTH_PX}x${MAX_VIDEO_HEIGHT_PX}`);
      }
      if (
        uploaded.kind === "video" &&
        typeof uploaded.durationSec === "number" &&
        uploaded.durationSec > MAX_VIDEO_DURATION_SEC
      ) {
        throw new Error(`Video duration exceeds ${MAX_VIDEO_DURATION_SEC} seconds`);
      }

      return createSocialPost({ skill, caption, tags, media: uploaded });
    },
    onSuccess: async () => {
      setComposer({ skill: "", caption: "", tags: "", file: null, instagramUrl: "" });
      setComposeInfo(null);
      setUploadProgress(0);
      await qc.invalidateQueries({ queryKey: ["social", "feed"] });
    },
    onError: (error) => {
      setComposeError(asErrorMessage(error, "Unable to publish post"));
    },
  });

  const likeMutation = useMutation({
    mutationFn: (postId: string) => toggleSocialLike(postId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["social", "feed"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (payload: { postId: string; text: string }) =>
      createSocialComment(payload.postId, payload.text),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["social", "feed"] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteSocialComment(commentId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["social", "feed"] });
    },
  });

  // Load Instagram embed.js once; re-process whenever new posts arrive
  useEffect(() => {
    if (!igScriptLoaded.current) {
      igScriptLoaded.current = true;
      const script = document.createElement("script");
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
    } else {
      (window as any).instgrm?.Embeds?.process();
    }
  }, [visiblePosts]);

  function onPublishPost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canPublish) return;
    pricing.runWithPricingLayer("social_publishing", () => publishMutation.mutate());
  }

  function submitComment(postId: string) {
    const draft = (draftByPost[postId] || "").trim();
    if (!draft) return;
    pricing.runWithPricingLayer(
      "social_publishing",
      () =>
        commentMutation.mutate(
          { postId, text: draft },
          {
            onSuccess: () => {
              setDraftByPost((prev) => ({ ...prev, [postId]: "" }));
            },
          }
        )
    );
  }

  function mediaHint(post: SocialFeedPost) {
    if (!post.media) return "No media";
    if (post.media.kind === "video" && post.media.durationSec) {
      return `${post.media.durationSec.toFixed(1)}s`;
    }
    if (post.media.width && post.media.height) {
      return `${post.media.width}x${post.media.height}`;
    }
    return post.media.format || post.media.kind;
  }

  return (
    <div className="social-module">
      <div className="social-shell">
        <header className="social-topbar">
          <div>
            <p className="social-topbar-label">EsportM Social</p>
            <h1>Talent Feed</h1>
          </div>

          <div className="social-topbar-actions">
            <label className="social-search" aria-label="Search posts">
              <Search size={16} />
              <input placeholder="Search skills, players, tags" />
            </label>
            <button type="button" className="social-filter-btn">
              <SlidersHorizontal size={15} />
              Filters
            </button>
          </div>
        </header>

        <div className="social-grid">
          <aside className="social-side">
            <article className="social-card social-profile-card">
              <p className="social-meta">Public visibility</p>
              <h3>Player Showcase</h3>
              <p>
                Players publish their clips publicly. Managers, club admins, and coaches
                can react and comment in real time.
              </p>
            </article>

            <article className="social-card social-stories">
              <div className="social-card-head">
                <h4>Featured Players</h4>
                <Sparkles size={14} />
              </div>
              <div className="social-story-list">
                {featuredAuthors.map((item) => (
                  <button key={item.name} type="button" className="social-story-pill">
                    <span>{initials(item.name)}</span>
                    <div>
                      <strong>{item.name}</strong>
                      <small>{roleLabel[item.role]}</small>
                    </div>
                  </button>
                ))}
                {!featuredAuthors.length ? <p className="social-empty">No active creators yet.</p> : null}
              </div>
            </article>
          </aside>

          <main className="social-feed">
            <section className="social-card social-composer">
              <div className="social-card-head">
                <h4>Post your skill</h4>
                <span>{canPublish ? "Public" : "Viewer mode"}</span>
              </div>

              {/* Mode toggle */}
              <div className="social-filter-row" style={{ marginBottom: 8 }}>
                <button
                  type="button"
                  className={`social-chip ${composeMode === "upload" ? "is-active" : ""}`}
                  onClick={() => setComposeMode("upload")}
                  disabled={publishMutation.isPending}
                >
                  <UploadCloud size={13} /> Upload
                </button>
                <button
                  type="button"
                  className={`social-chip ${composeMode === "instagram" ? "is-active" : ""}`}
                  onClick={() => setComposeMode("instagram")}
                  disabled={publishMutation.isPending}
                >
                  Instagram
                </button>
              </div>

              <form onSubmit={onPublishPost} className="social-composer-form">
                <input
                  value={composer.skill}
                  onChange={(event) => setComposer((prev) => ({ ...prev, skill: event.target.value }))}
                  placeholder="Skill title (example: weak-foot crossing)"
                  disabled={!canPublish || publishMutation.isPending}
                />
                <textarea
                  value={composer.caption}
                  onChange={(event) => setComposer((prev) => ({ ...prev, caption: event.target.value }))}
                  placeholder="Add context for managers/coaches reviewing this clip"
                  rows={3}
                  disabled={!canPublish || publishMutation.isPending}
                />
                <input
                  value={composer.tags}
                  onChange={(event) => setComposer((prev) => ({ ...prev, tags: event.target.value }))}
                  placeholder="Tags (comma separated)"
                  disabled={!canPublish || publishMutation.isPending}
                />

                {composeMode === "instagram" ? (
                  <input
                    value={composer.instagramUrl}
                    onChange={(event) => setComposer((prev) => ({ ...prev, instagramUrl: event.target.value }))}
                    placeholder="https://www.instagram.com/p/..."
                    disabled={!canPublish || publishMutation.isPending}
                  />
                ) : (
                  <>
                    <label className="social-upload-field">
                      <UploadCloud size={15} />
                      <span>{composer.file ? composer.file.name : "Choose image/video"}</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={(event) =>
                          setComposer((prev) => ({
                            ...prev,
                            file: event.target.files?.[0] || null,
                          }))
                        }
                        disabled={!canPublish || publishMutation.isPending}
                      />
                    </label>
                    <p className="social-note">
                      Image max: {(MAX_IMAGE_UPLOAD_BYTES / 1024 / 1024).toFixed(0)} MB and{" "}
                      {MAX_IMAGE_WIDTH_PX}x{MAX_IMAGE_HEIGHT_PX}. Video max:{" "}
                      {(MAX_VIDEO_UPLOAD_BYTES / 1024 / 1024).toFixed(0)} MB (raw input up to{" "}
                      {(MAX_VIDEO_INPUT_BYTES / 1024 / 1024).toFixed(0)} MB with auto compression),{" "}
                      {MAX_VIDEO_WIDTH_PX}x{MAX_VIDEO_HEIGHT_PX}, and {MAX_VIDEO_DURATION_SEC}s duration.
                    </p>
                  </>
                )}

                {publishMutation.isPending && composeMode === "upload" ? (
                  <div className="social-upload-progress">
                    <div style={{ width: `${uploadProgress}%` }} />
                  </div>
                ) : null}
                {composeInfo ? <p className="social-info">{composeInfo}</p> : null}
                {composeError ? <p className="social-error">{composeError}</p> : null}
                {!canPublish ? (
                  <p className="social-note">
                    Publishing is restricted to PLAYER accounts. Your role can still react and comment.
                  </p>
                ) : null}
                {canPublish && !canUseSocialPublishing ? (
                  <p className="social-note">
                    Publishing, reactions, and comments require a Professional club plan.
                  </p>
                ) : null}
                <div className="social-composer-row">
                  <button
                    type="submit"
                    className="social-publish-btn"
                    disabled={
                      !canPublish ||
                      publishMutation.isPending ||
                      !composer.skill.trim() ||
                      !composer.caption.trim() ||
                      (composeMode === "upload" ? !composer.file : !composer.instagramUrl.trim())
                    }
                  >
                    <Plus size={15} />
                    {publishMutation.isPending ? "Publishing..." : "Publish"}
                  </button>
                </div>
              </form>
            </section>

            <section className="social-filter-row" aria-label="Feed filters">
              {([
                ["ALL", "For You"],
                ["VIDEO", "Videos"],
                ["SCOUT_NOTES", "Scout Picks"],
              ] as Array<[FeedFilter, string]>).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`social-chip ${filter === value ? "is-active" : ""}`}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </section>

            <section className="social-post-list">
              {feedQuery.isLoading ? <p className="social-empty">Loading feed...</p> : null}
              {feedQuery.isError ? <p className="social-error">Unable to load feed right now.</p> : null}

              {visiblePosts.map((post, index) => {
                const cardStyle = {
                  "--social-stagger": `${index * 70}ms`,
                } as CSSProperties;
                const canDeleteForPost = (commentUserId: string) =>
                  userId && (commentUserId === userId || post.author.id === userId);

                return (
                  <article className="social-card social-post" key={post.id} style={cardStyle}>
                    <div className="social-post-head">
                      <div className="social-author">
                        <span>{initials(post.author.fullName)}</span>
                        <div>
                          <strong>{post.author.fullName}</strong>
                          <p>
                            {post.author.club?.name || "Public"} | {roleLabel[post.author.role]}
                          </p>
                        </div>
                      </div>
                      <small>{formatPostedAt(post.createdAt)}</small>
                    </div>

                    {post.instagramUrl ? (
                      <div className="social-media social-media--instagram">
                        <blockquote
                          className="instagram-media"
                          data-instgrm-permalink={post.instagramUrl}
                          data-instgrm-version="14"
                          style={{ margin: "0 auto", width: "100%", maxWidth: 540 }}
                        />
                      </div>
                    ) : post.media ? (
                      <div className="social-media">
                        {post.media.kind === "video" ? (
                          <video controls preload="metadata" src={post.media.url} />
                        ) : (
                          <img src={post.media.url} alt={post.skill} loading="lazy" />
                        )}
                        <div className="social-media-meta">
                          {post.media.kind === "video" ? <PlayCircle size={18} /> : null}
                          {mediaHint(post)}
                        </div>
                      </div>
                    ) : null}

                    <p className="social-caption">{post.caption}</p>
                    <p className="social-tags">{post.tags.map((tag) => `#${tag}`).join(" ")}</p>

                    <div className="social-actions">
                      <button
                        type="button"
                        className={post.stats.likedByMe ? "is-active" : ""}
                        onClick={() =>
                          pricing.runWithPricingLayer("social_publishing", () =>
                            likeMutation.mutate(post.id)
                          )
                        }
                        disabled={likeMutation.isPending}
                      >
                        <Heart size={16} />
                        {post.stats.reactions}
                      </button>
                      <button type="button">
                        <MessageCircle size={16} />
                        {post.stats.comments}
                      </button>
                      <button type="button">
                        <Share2 size={16} />
                        Share
                      </button>
                      <button
                        type="button"
                        className={savedByMe[post.id] ? "is-active" : ""}
                        onClick={() => setSavedByMe((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                      >
                        <Bookmark size={16} />
                        Save
                      </button>
                    </div>

                    <div className="social-comment-list">
                      {post.comments.slice(-5).map((comment) => (
                        <div key={comment.id} className="social-comment-row-item">
                          <p>
                            <strong>{comment.author.fullName}</strong> {comment.text}
                          </p>
                          {canDeleteForPost(comment.author.id) ? (
                            <button
                              type="button"
                              className="social-comment-delete"
                              onClick={() => deleteCommentMutation.mutate(comment.id)}
                              disabled={deleteCommentMutation.isPending}
                              title="Delete comment"
                            >
                              <Trash2 size={12} />
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    <div className="social-comment-row">
                      <input
                        value={draftByPost[post.id] || ""}
                        onChange={(event) =>
                          setDraftByPost((prev) => ({ ...prev, [post.id]: event.target.value }))
                        }
                        placeholder="Add a comment..."
                      />
                      <button
                        type="button"
                        onClick={() => submitComment(post.id)}
                        disabled={commentMutation.isPending}
                      >
                        <SendHorizonal size={14} />
                      </button>
                    </div>
                  </article>
                );
              })}

              {!feedQuery.isLoading && !visiblePosts.length ? (
                <p className="social-empty">No posts for this filter yet.</p>
              ) : null}
            </section>
          </main>

          <aside className="social-side social-side-right">
            <article className="social-card">
              <div className="social-card-head">
                <h4>Trending Skills</h4>
              </div>
              <div className="social-tags-panel">
                {trendingTags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
                {!trendingTags.length ? <p className="social-empty">No trending tags yet.</p> : null}
              </div>
            </article>

            <article className="social-card">
              <div className="social-card-head">
                <h4>Scouts Online</h4>
              </div>
              <ul className="social-online-list">
                {posts.slice(0, 4).map((post) => (
                  <li key={post.id}>
                    <strong>{post.author.fullName}</strong>
                    <span>{roleLabel[post.author.role]} | {post.author.club?.name || "Public"}</span>
                  </li>
                ))}
                {!posts.length ? <p className="social-empty">No active users in feed yet.</p> : null}
              </ul>
            </article>
          </aside>
        </div>
      </div>
    </div>
  );
}
