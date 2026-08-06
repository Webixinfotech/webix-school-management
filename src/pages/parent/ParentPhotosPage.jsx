import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Download, Heart, Eye, Calendar, X,
  FileArchive, CheckSquare, Square, Filter, Scan,
  Sparkles, Baby, ZoomIn, Check, AlertCircle,
  Loader2, RefreshCw, Image as ImageIcon, Users,
} from "lucide-react";
import { photoApi } from "../../api/photos";
import api from "../../api/axios";
import {
  getPhotoTitle, formatDate, formatBytes,
  PHOTO_CATEGORIES, parseApiError,
} from "../../utils/photoUtils";
import EmptyState from "../../components/photos/EmptyState";
import LoadingState from "../../components/photos/LoadingState";
import Toast from "../../components/photos/Toast";

const CATEGORIES = ["All", ...PHOTO_CATEGORIES];

/* ─────────────────────────────────────────────────────────────────────────────
   face-api.js  (CDN, free, runs 100% in browser — no API key)
   Models from @vladmandic mirror (smaller, faster than official)
───────────────────────────────────────────────────────────────────────────── */
const FACE_API_CDN =
  "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
const MODELS_URL =
  "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model";

let _loaded = false;
let _loading = false;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function ensureFaceApi() {
  if (_loaded) return true;
  if (_loading) {
    for (let i = 0; i < 40; i++) { await sleep(500); if (_loaded) return true; }
    return false;
  }
  _loading = true;
  try {
    if (!window.faceapi) {
      await new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = FACE_API_CDN;
        s.onload = res;
        s.onerror = () => rej(new Error("CDN load failed"));
        document.head.appendChild(s);
      });
    }
    await Promise.all([
      window.faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
      window.faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODELS_URL),
      window.faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
    ]);
    _loaded = true;
    return true;
  } catch (e) {
    console.error("face-api init failed:", e);
    return false;
  } finally {
    _loading = false;
  }
}

/**
 * Is this URL one of OUR backend API endpoints (relative, or same-origin /
 * matches our axios baseURL) vs. a third-party storage URL (S3, CDN, etc)?
 * We must NOT send our app's Authorization header to third-party hosts —
 * S3 will reject the CORS preflight if it sees an unexpected header that
 * isn't in its AllowedHeaders list, even with AllowedHeaders: ["*"] in some
 * configurations, and it's a security smell regardless.
 */
function isOwnApiUrl(url) {
  try {
    const u = new URL(url, window.location.origin);
    const apiBase = api?.defaults?.baseURL ? new URL(api.defaults.baseURL, window.location.origin) : null;
    if (apiBase && u.origin === apiBase.origin) return true;
    return u.origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Fetch image bytes and draw them onto a canvas so face-api can read pixel
 * data without tainting the canvas with cross-origin data.
 *
 * - Our own API URLs  -> use axios (`api`), which carries the app's auth.
 * - Third-party URLs (S3 etc) -> use plain `fetch`/`<img>` with NO auth
 *   header at all. These rely entirely on the bucket's CORS config
 *   (Access-Control-Allow-Origin) to succeed.
 */
async function urlToCanvas(url) {
  const useAxios = isOwnApiUrl(url);

  // Strategy 1: fetch the bytes
  try {
    let blob;
    if (useAxios) {
      const res = await api.get(url, { responseType: "blob" });
      blob = res.data;
    } else {
      // Plain, unauthenticated fetch — do NOT attach any custom headers,
      // S3 needs to see a "simple" CORS request to have the best chance
      // of matching the bucket's AllowedHeaders/AllowedOrigins config.
      const res = await fetch(url, { mode: "cors", credentials: "omit" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      blob = await res.blob();
    }
    if (!blob || blob.size === 0) throw new Error("Empty image response");

    const objUrl = URL.createObjectURL(blob);
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        URL.revokeObjectURL(objUrl);
        if (canvas.width === 0 || canvas.height === 0) {
          reject(new Error("Decoded image has zero dimensions"));
          return;
        }
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        reject(new Error("Browser could not decode image blob"));
      };
      img.src = objUrl;
    });
  } catch (fetchErr) {
    console.warn("[face-scan] blob fetch failed, falling back to <img crossOrigin>:", url, fetchErr?.message || fetchErr);
  }

  // Strategy 2: plain crossOrigin img tag (last resort; needs the host's
  // CORS headers to be present, same requirement as Strategy 1 for
  // third-party hosts — kept as a fallback for hosts that behave
  // differently for simple GET <img> requests vs. fetch()).
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      if (canvas.width === 0 || canvas.height === 0) {
        reject(new Error("Decoded image has zero dimensions"));
        return;
      }
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = () =>
      reject(new Error(
        `Image blocked by CORS — the storage bucket needs to allow origin "${window.location.origin}". URL: ${url}`
      ));
    img.src = url + (url.includes("?") ? "&_t=" : "?_t=") + Date.now();
  });
}

const DETECTOR_OPTIONS = () =>
  new window.faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.35 });

/** Single best descriptor for a profile photo. Throws with a specific reason on failure. */
async function profileDescriptor(url) {
  let canvas;
  try {
    canvas = await urlToCanvas(url);
  } catch (e) {
    throw new Error(
      `Could not load child's profile photo (likely the storage bucket's CORS settings ` +
      `don't allow this origin): ${e.message}`
    );
  }
  const det = await window.faceapi
    .detectSingleFace(canvas, DETECTOR_OPTIONS())
    .withFaceLandmarks(true)
    .withFaceDescriptor();
  if (!det) {
    throw new Error(
      "No face detected in child's profile photo. Use a clear, front-facing photo with good lighting."
    );
  }
  return det.descriptor;
}

/** All face descriptors found in a gallery photo. Returns [] on any failure (skip silently upstream). */
async function allDescriptors(url) {
  const canvas = await urlToCanvas(url);
  const dets = await window.faceapi
    .detectAllFaces(canvas, DETECTOR_OPTIONS())
    .withFaceLandmarks(true)
    .withFaceDescriptors();
  return dets.map((d) => d.descriptor);
}

function euclidean(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

function distToPercent(dist) {
  return Math.max(0, Math.min(100, Math.round((1 - dist / 0.6) * 100)));
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────────────────────── */
export default function ParentPhotosPage() {
  /* Data */
  const [photos, setPhotos]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [children, setChildren]   = useState([]); // all children of parent
  const [activeChild, setActiveChild] = useState(null); // {name, photo}

  /* UI state */
  const [filters, setFilters]     = useState({ search: "", category: "All" });
  const [selectedIds, setSelectedIds] = useState([]);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [likedIds, setLikedIds]   = useState([]);
  const [toast, setToast]         = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFilters, setShowFilters]     = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "child"

  /* Face recognition state */
  const [faceState, setFaceState] = useState("idle");
  // idle | loadingLib | loadingProfile | scanning | done | error
  const [faceProgress, setFaceProgress] = useState(0);
  const [faceError, setFaceError]       = useState("");
  const [faceScores, setFaceScores]     = useState({}); // { photoId: 0-100 }
  const childDescRef = useRef(null);

  /* ── Load parent profile → extract children ───────────────────────────── */
  useEffect(() => {
    api.get("/parents/my-profile")
      .then((res) => {
        // axios wraps in .data; API wraps in .data again
        const kids = res?.data?.data?.children || [];
        const mapped = kids.map((c) => ({
          id: c._id || c.id,
          name: `${c.firstName || ""} ${c.lastName || ""}`.trim(),
          photo: c.photo || null,
          className: c.className || "",
        }));
        setChildren(mapped);
        if (mapped.length > 0) setActiveChild(mapped[0]);
      })
      .catch((e) => console.warn("profile load:", e));
  }, []);

  /* ── Load photos ──────────────────────────────────────────────────────── */
  const loadPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const params = { status: "approved", uploadType: "parents", isDeleted: "false" };
      if (filters.search) params.search = filters.search;
      if (filters.category !== "All") params.category = filters.category;
      const res = await photoApi.getPhotos(params);
      const list = res.data || [];
      setPhotos(list);
      setLikedIds(list.filter((p) => p.isLiked).map((p) => p._id));
    } catch (err) {
      showToast("error", "Error", parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  /* ── Face Recognition ─────────────────────────────────────────────────── */
  const runFaceScan = useCallback(async (child = activeChild, photoList = photos) => {
    if (!child?.photo) {
      showToast("error", "No Profile Photo", "Child's profile photo is not available. Please upload one first.");
      return;
    }
    if (photoList.length === 0) {
      showToast("error", "No Photos", "Gallery is empty. Nothing to scan.");
      return;
    }

    setFaceState("loadingLib");
    setFaceError("");
    setFaceScores({});
    setFaceProgress(0);

    try {
      const ok = await ensureFaceApi();
      if (!ok) throw new Error("Face recognition library could not be loaded. Check your internet connection.");

      setFaceState("loadingProfile");
      const desc = await profileDescriptor(child.photo);
      childDescRef.current = desc;

      setFaceState("scanning");
      const scores = {};
      let failedCount = 0;
      for (let i = 0; i < photoList.length; i++) {
        setFaceProgress(Math.round(((i + 1) / photoList.length) * 100));
        try {
          const descs = await allDescriptors(photoList[i].imageUrl);
          if (descs.length === 0) continue;
          const bestDist = Math.min(...descs.map((d) => euclidean(desc, d)));
          const pct = distToPercent(bestDist);
          if (pct >= 35) scores[photoList[i]._id] = pct;
        } catch (photoErr) {
          // unprocessable image — skip but keep a log for debugging
          failedCount += 1;
          console.warn(`[face-scan] skipped photo ${photoList[i]._id}:`, photoErr?.message || photoErr);
        }
      }

      if (failedCount === photoList.length) {
        throw new Error(
          "Could not process any gallery photos (likely an image-loading/CORS issue). Check console for per-photo errors."
        );
      }

      setFaceScores(scores);
      setFaceState("done");
    } catch (err) {
      console.error("[face-scan] failed:", err);
      setFaceState("error");
      setFaceError(err.message || "Face recognition failed.");
    }
  }, [activeChild, photos]);

  const resetFace = () => {
    setFaceState("idle");
    setFaceScores({});
    setFaceError("");
    setFaceProgress(0);
    childDescRef.current = null;
    setActiveTab("all");
  };

  /* ── Filtered list ────────────────────────────────────────────────────── */
  const displayPhotos = photos
    .filter((p) => {
      const matchSearch =
        !filters.search ||
        getPhotoTitle(p).toLowerCase().includes(filters.search.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(filters.search.toLowerCase());
      if (activeTab === "child" && faceState === "done") {
        return matchSearch && faceScores[p._id] !== undefined;
      }
      const matchCat = filters.category === "All" || p.category === filters.category;
      return matchSearch && matchCat;
    })
    .map((p) => ({ ...p, _faceScore: faceScores[p._id] }))
    .sort((a, b) =>
      activeTab === "child" ? (b._faceScore || 0) - (a._faceScore || 0) : 0
    );

  const matchedCount = Object.keys(faceScores).length;

  /* ── Actions ──────────────────────────────────────────────────────────── */
  function showToast(type, title, message) {
    setToast({ type, title, message });
  }

  const handleLike = async (photoId) => {
    try {
      await photoApi.likePhoto(photoId);
      setLikedIds((prev) =>
        prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
      );
      setPhotos((prev) =>
        prev.map((p) =>
          p._id === photoId
            ? { ...p, isLiked: !p.isLiked, likesCount: (p.likesCount || 0) + (p.isLiked ? -1 : 1) }
            : p
        )
      );
    } catch (err) {
      showToast("error", "Like Failed", parseApiError(err));
    }
  };

  const handleDownload = async (photo) => {
    try {
      setActionLoading(true);
      await photoApi.downloadPhoto(photo._id, getPhotoTitle(photo));
      showToast("success", "Download Started", "Your photo download has begun.");
    } catch (err) {
      showToast("error", "Download Failed", parseApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDownload = async (ids = selectedIds) => {
    if (!ids.length) return;
    try {
      setActionLoading(true);
      await photoApi.parentBulkDownload({ photoIds: ids }, "my-photos.zip");
      showToast("success", "Download Started", `${ids.length} photo(s) downloading as ZIP.`);
      setSelectedIds([]);
    } catch (err) {
      showToast("error", "Download Failed", parseApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelect = (id) =>
    setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === displayPhotos.length ? [] : displayPhotos.map((p) => p._id));

  /* ── Switch active child ──────────────────────────────────────────────── */
  const switchChild = (child) => {
    setActiveChild(child);
    resetFace();
  };

  /* ── Tab switch + auto-start face scan ─────────────────────────────────── */
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    if (tab === "child" && faceState === "idle" && activeChild) {
      runFaceScan(activeChild, photos);
    }
  };

  /* ── Scanning in progress ─────────────────────────────────────────────── */
  const isBusy = ["loadingLib", "loadingProfile", "scanning"].includes(faceState);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6">

        {/* ══════ HERO HEADER ═══════════════════════════════════════════════ */}
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-6 text-white shadow-xl shadow-purple-200">
          {/* decorative dots */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "radial-gradient(white 1.5px, transparent 1.5px)", backgroundSize: "28px 28px" }} />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: child info */}
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                {activeChild?.photo ? (
                  <img src={activeChild.photo} alt={activeChild.name}
                    className="h-16 w-16 rounded-2xl object-cover ring-4 ring-white/30 shadow-lg" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
                    <Baby size={30} className="text-white/80" />
                  </div>
                )}
                {faceState === "done" && matchedCount > 0 && (
                  <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-green-400 ring-2 ring-white shadow">
                    <Check size={12} className="text-white" />
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-violet-200">
                  Photo Gallery
                </p>
                <h1 className="mt-0.5 text-2xl font-bold leading-tight">
                  {activeChild ? `${activeChild.name}'s Memories` : "School Memories"}
                </h1>
                <p className="mt-1 flex flex-wrap gap-3 text-sm text-violet-200">
                  <span>{photos.length} photos</span>
                  <span>·</span>
                  <span>{likedIds.length} liked</span>
                  {faceState === "done" && (
                    <>
                      <span>·</span>
                      <span className="font-semibold text-green-300">{matchedCount} face matches</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex flex-wrap gap-2">
              {/* Child switcher (if multiple children) */}
              {children.length > 1 && (
                <select
                  value={activeChild?.id || ""}
                  onChange={(e) => {
                    const c = children.find((x) => x.id === e.target.value);
                    if (c) switchChild(c);
                  }}
                  className="rounded-2xl border border-white/30 bg-white/15 px-3 py-2 text-sm font-medium text-white backdrop-blur focus:outline-none"
                >
                  {children.map((c) => (
                    <option key={c.id} value={c.id} className="text-slate-900">{c.name}</option>
                  ))}
                </select>
              )}

              {/* Face scan button */}
              {!isBusy && faceState !== "done" && (
                <button onClick={() => { handleTabSwitch("child"); }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25">
                  <Scan size={16} />
                  <span className="hidden sm:inline">Smart Face Match</span>
                  <span className="sm:hidden">Scan</span>
                </button>
              )}
              {faceState === "done" && (
                <button onClick={resetFace}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25">
                  <RefreshCw size={15} /> Reset
                </button>
              )}

              <button onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                  showFilters
                    ? "border-white bg-white text-purple-700 shadow"
                    : "border-white/30 bg-white/15 text-white backdrop-blur hover:bg-white/25"
                }`}>
                <Filter size={15} />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>
          </div>
        </header>

        {/* ══════ FACE STATUS BANNERS ════════════════════════════════════════ */}
        {isBusy && (
          <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="animate-spin text-indigo-600 flex-shrink-0" size={20} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-indigo-900">
                  {faceState === "loadingLib" && "Loading AI face recognition…"}
                  {faceState === "loadingProfile" && "Analysing child's photo…"}
                  {faceState === "scanning" && `Scanning photos… ${faceProgress}%`}
                </p>
                <p className="text-xs text-indigo-600">
                  {faceState === "loadingLib" && "Downloading models (~5 MB, one-time only)"}
                  {faceState === "loadingProfile" && "Extracting face signature from profile"}
                  {faceState === "scanning" && `${Math.round((faceProgress / 100) * photos.length)} of ${photos.length} photos processed`}
                </p>
              </div>
            </div>
            {faceState === "scanning" && (
              <div className="h-2 overflow-hidden rounded-full bg-indigo-200">
                <div className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${faceProgress}%` }} />
              </div>
            )}
          </div>
        )}

        {faceState === "done" && matchedCount > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-3xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-3">
              <Sparkles size={20} className="flex-shrink-0 text-green-600" />
              <div>
                <p className="text-sm font-bold text-green-900">
                  Found {matchedCount} photos featuring {activeChild?.name?.split(" ")[0] || "your child"}!
                </p>
                <p className="text-xs text-green-700">Sorted by match confidence. Switch tab to view all.</p>
              </div>
            </div>
            <button onClick={() => handleBulkDownload(displayPhotos.filter(p => faceScores[p._id]).map(p => p._id))}
              disabled={actionLoading}
              className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-2xl bg-green-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-green-700 transition disabled:opacity-60">
              <FileArchive size={13} /> Download All
            </button>
          </div>
        )}

        {faceState === "done" && matchedCount === 0 && (
          <div className="flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4">
            <AlertCircle size={20} className="flex-shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-amber-900">No face matches found</p>
              <p className="text-xs text-amber-700">Try using a clearer profile photo, or check if gallery has recent photos.</p>
            </div>
          </div>
        )}

        {faceState === "error" && (
          <div className="flex items-center gap-3 rounded-3xl border border-red-200 bg-red-50 p-4">
            <AlertCircle size={20} className="flex-shrink-0 text-red-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-900">Face Recognition Error</p>
              <p className="text-xs text-red-700 break-words">{faceError}</p>
            </div>
            <button onClick={() => runFaceScan()}
              className="flex-shrink-0 rounded-xl border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 transition">
              Retry
            </button>
          </div>
        )}

        {/* ══════ FILTERS ════════════════════════════════════════════════════ */}
        {showFilters && (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="relative">
                <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={filters.search}
                  onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                  placeholder="Search photos…"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100" />
              </label>
              <select value={filters.category}
                onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
                disabled={activeTab === "child"}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:opacity-50">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ══════ TABS ═══════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
          {[
            { key: "all", label: "All Photos", count: photos.length, icon: <ImageIcon size={14} /> },
            {
              key: "child",
              label: `${activeChild?.name?.split(" ")[0] || "Child"}'s Photos`,
              count: faceState === "done" ? matchedCount : null,
              icon: <Baby size={14} />,
            },
          ].map((tab) => (
            <button key={tab.key}
              onClick={() => handleTabSwitch(tab.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-600 hover:text-slate-900"
              }`}>
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.key === "all" ? "All" : "Child"}</span>
              {tab.count !== null && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══════ BULK BAR ═══════════════════════════════════════════════════ */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-violet-200 bg-violet-50 p-4">
            <div className="flex items-center gap-3">
              <button onClick={toggleSelectAll} className="text-violet-600">
                {selectedIds.length === displayPhotos.length
                  ? <CheckSquare size={20} />
                  : <Square size={20} />}
              </button>
              <span className="text-sm font-bold text-violet-900">{selectedIds.length} selected</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleBulkDownload()} disabled={actionLoading}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-violet-300 bg-white px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 transition disabled:opacity-60">
                <FileArchive size={14} /> ZIP Download
              </button>
              <button onClick={() => setSelectedIds([])}
                className="rounded-2xl px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition">
                Clear
              </button>
            </div>
          </div>
        )}

        {/* ══════ PHOTO GRID ═════════════════════════════════════════════════ */}
        {loading ? (
          <LoadingState title="Loading gallery" />
        ) : displayPhotos.length === 0 ? (
          isBusy ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-100">
                <Scan size={36} className="text-violet-400" />
              </div>
              <p className="text-lg font-bold text-slate-700">Scanning Photos…</p>
              <p className="mt-1 text-sm text-slate-500">This may take a moment for large galleries.</p>
            </div>
          ) : (
            <EmptyState
              title={activeTab === "child" ? "No Matches Found" : "No Photos Yet"}
              description={activeTab === "child"
                ? "Try refreshing the scan or upload a clearer profile photo."
                : "Check back later for new school memories."}
            />
          )
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayPhotos.map((photo) => (
              <PhotoCard key={photo._id}
                photo={photo}
                isLiked={likedIds.includes(photo._id)}
                selected={selectedIds.includes(photo._id)}
                showScore={activeTab === "child" && faceState === "done"}
                onLike={() => handleLike(photo._id)}
                onPreview={() => setPreviewPhoto(photo)}
                onDownload={() => handleDownload(photo)}
                onSelect={() => toggleSelect(photo._id)} />
            ))}
          </div>
        )}
      </div>

      {/* ══════ PREVIEW MODAL ══════════════════════════════════════════════ */}
      {previewPhoto && (
        <PreviewModal
          photo={previewPhoto}
          onClose={() => setPreviewPhoto(null)}
          isLiked={likedIds.includes(previewPhoto._id)}
          onLike={() => handleLike(previewPhoto._id)}
          onDownload={() => handleDownload(previewPhoto)}
          actionLoading={actionLoading}
          faceScore={faceScores[previewPhoto._id]}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Photo Card
───────────────────────────────────────────────────────────────────────────── */
function PhotoCard({ photo, isLiked, selected, showScore, onLike, onPreview, onDownload, onSelect }) {
  const score = photo._faceScore;
  const scoreColor =
    score >= 70 ? "#16a34a" : score >= 50 ? "#d97706" : "#6366f1";

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-100/60">
      {/* Thumbnail */}
      <div className="relative h-52 overflow-hidden bg-slate-100">
        <img src={photo.imageUrl} alt={getPhotoTitle(photo)}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105 select-none" />

        {/* bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 via-slate-900/10 to-transparent p-3">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/85 px-2.5 py-1 text-xs font-semibold text-slate-700 backdrop-blur-sm">
              {photo.category}
            </span>
            {showScore && score !== undefined && (
              <span className="rounded-full px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm"
                style={{ background: scoreColor }}>
                ✦ {score}%
              </span>
            )}
          </div>
        </div>

        {/* Checkbox */}
        <button type="button" onClick={onSelect}
          aria-label="Select photo"
          className={`absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur-sm transition ${
            selected
              ? "border-violet-400 bg-violet-500 text-white"
              : "border-white/70 bg-white/80 text-slate-600 hover:border-violet-400"
          }`}>
          {selected ? <CheckSquare size={16} /> : <Square size={16} />}
        </button>

        {/* Preview hover */}
        <div role="button" onClick={onPreview} aria-label="Preview"
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-slate-950/0 opacity-0 transition hover:bg-slate-950/40 hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 shadow-lg">
            <ZoomIn size={20} className="text-slate-900" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="line-clamp-1 text-sm font-bold text-slate-900">{getPhotoTitle(photo)}</h3>
        {photo.description && (
          <p className="line-clamp-2 text-xs text-slate-500 leading-relaxed">{photo.description}</p>
        )}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {formatDate(photo.uploadedAt, { month: "short", day: "numeric" })}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={11} /> {photo.viewsCount || 0}
          </span>
          <span className="flex items-center gap-1">
            <Users size={11} />
            {photo.uploadedBy?.name || "-"}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <button onClick={onLike}
            className={`flex items-center gap-1.5 text-sm font-semibold transition ${
              isLiked ? "text-rose-500" : "text-slate-400 hover:text-rose-500"
            }`}>
            <Heart size={15} fill={isLiked ? "currentColor" : "none"} />
            {photo.likesCount || 0}
          </button>
          <button onClick={onDownload}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700">
            <Download size={12} /> Save
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Preview Modal
───────────────────────────────────────────────────────────────────────────── */
function PreviewModal({ photo, onClose, isLiked, onLike, onDownload, actionLoading, faceScore }) {
  if (!photo) return null;
  const scoreColor =
    faceScore >= 70 ? "#16a34a" : faceScore >= 50 ? "#d97706" : "#6366f1";

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-slate-950/80 p-0 sm:p-4 backdrop-blur-sm"
      onClick={onClose}>
      <div
        className="w-full sm:max-w-5xl overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] bg-white shadow-2xl
          max-h-[95svh] sm:max-h-[92vh] flex flex-col sm:grid sm:grid-cols-[1.3fr_0.7fr]"
        onClick={(e) => e.stopPropagation()}>

        {/* ── Image panel ── */}
        <div className="relative flex items-center justify-center bg-slate-950 min-h-[45vw] sm:min-h-0">
          <img src={photo.imageUrl} alt={getPhotoTitle(photo)}
            className="max-h-[50vh] sm:max-h-[85vh] w-full object-contain" />
          {faceScore !== undefined && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold text-white shadow-lg"
              style={{ background: scoreColor }}>
              <Sparkles size={13} /> {faceScore}% face match
            </div>
          )}
          {/* close on mobile */}
          <button onClick={onClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur hover:bg-white/25 sm:hidden">
            <X size={18} />
          </button>
        </div>

        {/* ── Details panel ── */}
        <div className="flex flex-col overflow-y-auto">
          {/* header */}
          <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="min-w-0 pr-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Photo Detail</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900 line-clamp-2">{getPhotoTitle(photo)}</h3>
            </div>
            <button onClick={onClose}
              className="hidden sm:flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          {/* body */}
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
            {/* badges */}
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                {photo.category}
              </span>
              {photo.event && (
                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {photo.event}
                </span>
              )}
            </div>

            {photo.description && (
              <p className="text-sm leading-relaxed text-slate-600">{photo.description}</p>
            )}

            {/* meta grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Uploaded by", photo.uploadedBy?.name || photo.uploadedBy || "-"],
                ["Date", formatDate(photo.uploadedAt, { day: "numeric", month: "short", year: "numeric" })],
                ["File size", formatBytes(photo.fileSize)],
                ["Views / Likes", `${photo.viewsCount || 0} / ${photo.likesCount || 0}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 break-words">{value}</p>
                </div>
              ))}
            </div>

            {/* face match bar */}
            {faceScore !== undefined && (
              <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-violet-600">
                  Face Match Score
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white shadow-inner">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${faceScore}%`, background: scoreColor }} />
                  </div>
                  <span className="text-sm font-bold text-slate-800">{faceScore}%</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {faceScore >= 70 ? "✓ High confidence — strong match"
                    : faceScore >= 50 ? "~ Moderate confidence — likely match"
                    : "? Low confidence — possible match"}
                </p>
              </div>
            )}
          </div>

          {/* action buttons */}
          <div className="flex gap-3 border-t border-slate-100 px-5 py-4 sm:px-6">
            <button onClick={onLike} disabled={actionLoading}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition disabled:opacity-60 ${
                isLiked
                  ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}>
              <Heart size={15} fill={isLiked ? "currentColor" : "none"} />
              {isLiked ? "Liked" : "Like"}
            </button>
            <button onClick={onDownload} disabled={actionLoading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:opacity-90 disabled:opacity-60">
              <Download size={15} /> Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}