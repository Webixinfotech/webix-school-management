import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  Droplet,
  BookOpen,
  Hash,
  Share2,
  ChevronDown,
  Printer,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { idCardAPI, triggerPdfDownload } from "../../api/idCard.api";

function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);
  const remove = useCallback(
    (id) => setToasts((p) => p.filter((t) => t.id !== id)),
    [],
  );
  return { toasts, add, remove };
}

function ToastContainer({ toasts, remove }) {
  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl text-sm font-medium pointer-events-auto border
            ${t.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}
        >
          {t.type === "success" ? (
            <CheckCircle size={14} />
          ) : (
            <AlertCircle size={14} />
          )}
          <span className="flex-1">{t.msg}</span>
          <button
            onClick={() => remove(t.id)}
            className="opacity-50 hover:opacity-100"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

function Spinner({ size = "md", color = "indigo" }) {
  const sz = size === "sm" ? "w-4 h-4 border-2" : "w-8 h-8 border-2";
  const col =
    color === "white"
      ? "border-white/30 border-t-white"
      : "border-slate-200 border-t-indigo-500";
  return <div className={`${sz} ${col} rounded-full animate-spin`} />;
}

// ─── ID CARD VISUAL ───────────────────────────────────────────────────────────
function IdCardVisual({ card }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="relative w-full max-w-[450px] mx-auto select-none rounded-[12px] overflow-hidden shadow-2xl border border-slate-200 bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="bg-[#1a237e] pt-3 pb-2 px-4 text-center flex flex-col items-center justify-center">
         <div className="w-[42px] h-[42px] bg-white rounded-[8px] mb-1.5 flex flex-col items-center justify-center overflow-hidden p-0.5 border border-white/20">
            <span className="text-red-500 font-black text-[9px] leading-[1.1] uppercase tracking-tighter">BRAIN</span>
            <span className="text-orange-500 font-bold text-[7.5px] leading-[1.1] uppercase tracking-tighter">BUILDER</span>
            <span className="text-blue-500 font-bold text-[5.5px] leading-[1.1] whitespace-nowrap">Pre-School</span>
         </div>
         <h2 className="text-white font-bold text-[14px] tracking-wide mb-0.5 leading-tight">Brain Builder International Pre-School</h2>
         <p className="text-white/80 text-[10px] leading-tight">Your Child's Success Ladder</p>
      </div>

      {/* Body */}
      <div className="bg-white px-8 py-5 flex flex-row items-start justify-between relative min-h-[175px]">
        {/* Left Column */}
        <div className="flex flex-col items-center w-[45%]">
           <div className="w-[105px] h-[105px] border-[1.5px] border-[#1a237e] bg-[#e8f4fd] flex items-center justify-center overflow-hidden mb-3 shadow-sm">
             {card.photo && !imgErr ? (
                <img src={card.photo} alt={card.name} onError={() => setImgErr(true)} className="w-full h-full object-cover" />
             ) : (
                <span className="text-[#1a237e] font-black text-4xl tracking-tighter">{getInitials(card.name)}</span>
             )}
           </div>
           <p className="text-[#1a237e] font-bold text-[14px] text-center w-full truncate leading-tight">{card.name}</p>
        </div>

        {/* Right Column */}
        <div className="flex flex-col items-center w-[45%]">
           <div className="w-[105px] h-[105px] border-[1.5px] border-[#1a237e] bg-white flex items-center justify-center overflow-hidden mb-2 p-1.5 shadow-sm">
             {card.qrCode ? (
                <img src={card.qrCode} alt="QR" className="w-full h-full object-contain" />
             ) : (
                <span className="text-gray-300 text-[10px] font-bold">No QR</span>
             )}
           </div>
           <div className="text-center w-full flex flex-col gap-[3px]">
             <div>
               <p className="text-gray-400 text-[8.5px] leading-none uppercase font-semibold">Admission No.</p>
               <p className="text-black font-bold text-[11px] leading-none truncate mt-[2px]">{card.admissionNo || "—"}</p>
             </div>
             <div>
               <p className="text-gray-400 text-[8.5px] leading-none uppercase font-semibold">DOB</p>
               <p className="text-black font-bold text-[11px] leading-none truncate mt-[2px]">{card.dob || "—"}</p>
             </div>
             <div>
               <p className="text-gray-400 text-[8.5px] leading-none uppercase font-semibold">Parent</p>
               <p className="text-black font-bold text-[11px] leading-none truncate mt-[2px]">{card.parentName || "—"}</p>
             </div>
           </div>
        </div>
        
        {/* Class Info */}
        <div className="absolute bottom-[18px] left-8">
           <p className="text-gray-400 text-[8.5px] leading-none uppercase font-semibold">Class</p>
           <p className="text-black font-bold text-[12.5px] leading-none truncate mt-[3px]">{card.class || "—"}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#1a237e] px-5 py-2 flex items-center justify-between relative">
         <p className="text-white text-[10px] font-medium">Valid Until: {card.validity || "—"}</p>
         <div className="text-center flex flex-col items-center">
            <p className="text-white/60 text-[8px] leading-none mb-[2px]">Contact</p>
            <p className="text-[#1a237e] bg-white font-bold text-[10px] leading-none px-1.5 py-[1px] rounded-[3px]">{card.contactNumber || "—"}</p>
            <p className="text-white/70 text-[8.5px] leading-none mt-1">Session: {card.session}</p>
         </div>
         <p className="text-white text-[10px] font-medium tracking-wide">Well come</p>
      </div>
      
      {/* Decorative Bottom border */}
      <div className="h-2 w-full bg-[#15803d]"></div>
    </div>
  );
}

// ─── DETAIL ROW ───────────────────────────────────────────────────────────────
function DetailRow({ icon: Icon, label, value, accent }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${accent ? "bg-indigo-50" : "bg-slate-50"}`}
      >
        <Icon
          size={13}
          className={accent ? "text-indigo-500" : "text-slate-400"}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide leading-none mb-0.5">
          {label}
        </p>
        <p className="text-[13px] font-semibold text-slate-800 truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── CHILD SELECTOR ───────────────────────────────────────────────────────────
function ChildSelector({ children, selectedId, onSelect }) {
  if (!children || children.length <= 1) return null;
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center pointer-events-none">
        <User size={11} className="text-indigo-500" />
      </div>
      <select
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full border border-slate-200 rounded-xl pl-10 pr-8 py-2.5 text-sm font-semibold text-slate-700 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm"
      >
        {children.map((c) => (
          <option key={c.id || c._id} value={c.id || c._id}>
            {c.name}
            {c.class
              ? ` — Class ${c.class}${c.section ? " " + c.section : ""}`
              : ""}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const ParentIdCardPage = () => {
  const { user } = useAuth();
  const { toasts, add: toast, remove } = useToast();

  const [children, setChildren] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [card, setCard] = useState(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState("");
  const [downloading, setDownloading] = useState(false);

  // ── Fetch children ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setChildrenLoading(true);
      try {
        const res = await api.get("/students/my-children");
        const raw = res.data?.data || res.data || [];
        const list = (Array.isArray(raw) ? raw : []).map((c) => ({
          ...c,
          id: c._id || c.id,
          _id: c._id || c.id,
          name:
            c.fullName ||
            (c.firstName
              ? `${c.firstName} ${c.lastName || ""}`.trim()
              : null) ||
            c.name ||
            c.studentName ||
            "Student",
          class: c.className || c.class || "",
          section: c.section || "",
          photo: c.photo || c.profilePhoto || null,
        }));
        setChildren(list);
        let preferred = list[0];
        if (user?.children?.[0]?.id) {
          const match = list.find(
            (c) => (c.id || c._id) === user.children[0].id,
          );
          if (match) preferred = match;
        }
        if (preferred) setSelectedId(preferred.id || preferred._id);
      } catch {
        setCardError("Could not load children. Please try again.");
      } finally {
        setChildrenLoading(false);
      }
    };
    load();
  }, [user]);

  // ── Fetch card ─────────────────────────────────────────────────────────────
  const fetchCard = useCallback(async () => {
    if (!selectedId) return;
    setCardLoading(true);
    setCardError("");
    setCard(null);
    try {
      const res = await idCardAPI.getMyChildCard(selectedId);
      const d = res.data || res || {};
      setCard({
        ...d,
        name:
          d.name ||
          d.fullName ||
          (d.firstName ? `${d.firstName} ${d.lastName || ""}`.trim() : "") ||
          "Student",
        class: d.class || d.className || "",
        section: d.section || "",
        admissionNo: d.admissionNo || d.enrollmentId || "",
        photo: d.photo || d.profilePhoto || null,
      });
    } catch (err) {
      setCardError(err?.response?.data?.message || "Could not load ID card.");
    } finally {
      setCardLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchCard();
  }, [fetchCard]);

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!selectedId) return;
    setDownloading(true);
    try {
      const res = await idCardAPI.downloadMyChildCard(selectedId);
      triggerPdfDownload(res, `id-card-${card?.admissionNo || selectedId}.pdf`);
      toast("ID card PDF downloaded!");
    } catch {
      toast("Download failed. Please try again.", "error");
    } finally {
      setDownloading(false);
    }
  };

  // ── Share ──────────────────────────────────────────────────────────────────
  const handleShare = () => {
    if (!card?.qrData) return;
    if (navigator.share) {
      navigator
        .share({ title: `${card.name}'s ID`, url: card.qrData })
        .catch(() => {});
    } else {
      navigator.clipboard
        .writeText(card.qrData)
        .then(() => toast("Verification link copied!"));
    }
  };

  // ── Print ──────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    if (!card) return;
    const pw = window.open("", "_blank", "width=800,height=600");
    pw.document
      .write(`<!DOCTYPE html><html><head><title>ID Card – ` + card.name + `</title>
    <style>
      body{margin:0;padding:20px;font-family:Arial,sans-serif;background:#f8f9fa;}
      .card{width:450px;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.15);margin:0 auto;background:#fff;}
      .hdr{background:#1a237e;text-align:center;padding:12px 16px 8px;}
      .hdr-logo{width:42px;height:42px;background:#fff;border-radius:8px;margin:0 auto 6px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2px;box-sizing:border-box;}
      .hdr-logo span:nth-child(1){color:#ef4444;font-weight:900;font-size:9px;line-height:1.1;text-transform:uppercase;letter-spacing:-0.5px;}
      .hdr-logo span:nth-child(2){color:#f97316;font-weight:700;font-size:7.5px;line-height:1.1;text-transform:uppercase;letter-spacing:-0.5px;}
      .hdr-logo span:nth-child(3){color:#3b82f6;font-weight:700;font-size:5.5px;line-height:1.1;}
      .hdr h2{color:#fff;font-size:14px;margin:0 0 2px;font-weight:700;letter-spacing:0.5px;}
      .hdr p{color:rgba(255,255,255,0.8);font-size:10px;margin:0;}
      .body{padding:20px 32px;display:flex;justify-content:space-between;position:relative;min-height:175px;box-sizing:border-box;}
      .col{display:flex;flex-direction:column;align-items:center;width:45%;}
      .photo-box{width:105px;height:105px;border:1.5px solid #1a237e;background:#e8f4fd;margin-bottom:12px;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.05);}
      .photo-box img{width:100%;height:100%;object-fit:cover;}
      .photo-box span{color:#1a237e;font-size:36px;font-weight:900;letter-spacing:-1px;}
      .name{color:#1a237e;font-size:14px;font-weight:700;text-align:center;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0;}
      .qr-box{width:105px;height:105px;border:1.5px solid #1a237e;background:#fff;margin-bottom:8px;padding:6px;box-sizing:border-box;box-shadow:0 1px 2px rgba(0,0,0,0.05);}
      .qr-box img{width:100%;height:100%;object-fit:contain;}
      .details{text-align:center;width:100%;}
      .details div{margin-bottom:3px;}
      .lbl{color:#9ca3af;font-size:8.5px;margin:0;line-height:1;text-transform:uppercase;font-weight:600;}
      .val{color:#000;font-size:11px;font-weight:700;margin:2px 0 0;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .class-info{position:absolute;bottom:18px;left:32px;}
      .class-info .lbl{margin-bottom:2px;}
      .class-info .val{font-size:12.5px;margin-top:0px;}
      .ftr{background:#1a237e;padding:8px 20px;display:flex;justify-content:space-between;align-items:center;}
      .ftr-left, .ftr-right{color:#fff;font-size:10px;font-weight:500;}
      .ftr-right{letter-spacing:0.3px;}
      .ftr-center{text-align:center;display:flex;flex-direction:column;align-items:center;}
      .ftr-center .contact-lbl{color:rgba(255,255,255,0.6);font-size:8px;margin:0 0 2px;line-height:1;}
      .ftr-center .contact{color:#1a237e;background:#fff;font-weight:700;font-size:10px;padding:1px 6px;border-radius:3px;margin:0;line-height:1;}
      .ftr-center .session{color:rgba(255,255,255,0.7);font-size:8.5px;margin:4px 0 0;line-height:1;}
      .green-bar{height:8px;width:100%;background:#15803d;}
      @media print{body{padding:0;background:#fff;}}
    </style></head><body>
    <div class="card">
      <div class="hdr">
         <div class="hdr-logo">
            <span>BRAIN</span><span>BUILDER</span><span>Pre-School</span>
         </div>
         <h2>Brain Builder International Pre-School</h2>
         <p>Your Child's Success Ladder</p>
      </div>
      <div class="body">
        <div class="col">
           <div class="photo-box">
             ` + (card.photo ? `<img src="` + card.photo + `" alt="` + card.name + `"/>` : `<span>` + getInitials(card.name) + `</span>`) + `
           </div>
           <p class="name">` + card.name + `</p>
        </div>
        <div class="col">
           <div class="qr-box">
             ` + (card.qrCode ? `<img src="` + card.qrCode + `" alt="QR"/>` : `<span>No QR</span>`) + `
           </div>
           <div class="details">
             <div><p class="lbl">Admission No.</p><p class="val">` + (card.admissionNo || "—") + `</p></div>
             <div><p class="lbl">DOB</p><p class="val">` + (card.dob || "—") + `</p></div>
             <div><p class="lbl">Parent</p><p class="val">` + (card.parentName || "—") + `</p></div>
           </div>
        </div>
        <div class="class-info">
           <p class="lbl">Class</p>
           <p class="val">` + (card.class || "—") + `</p>
        </div>
      </div>
      <div class="ftr">
         <div class="ftr-left">Valid Until: ` + (card.validity || "—") + `</div>
         <div class="ftr-center">
            <p class="contact-lbl">Contact</p>
            <p class="contact">` + (card.contactNumber || "—") + `</p>
            <p class="session">Session: ` + (card.session || "—") + `</p>
         </div>
         <div class="ftr-right">Well come</div>
      </div>
      <div class="green-bar"></div>
    </div>
    <script>window.onload=function(){window.print();}</script>
    </body></html>`);
    pw.document.close();
  };
  const selectedChild = children.find((c) => (c.id || c._id) === selectedId);

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 overflow-hidden">
      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div className="flex-none flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-slate-100 shadow-sm gap-2 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
            <CreditCard size={15} className="md:size-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-black text-slate-800 tracking-tight leading-none">
              Child ID Card
            </h1>
            <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5">
              View, download & print school ID
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ChildSelector
            children={children}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
          />
          {children.length === 1 && selectedChild && (
            <div className="hidden sm:flex items-center gap-1.5 bg-indigo-50 rounded-xl px-2.5 py-1.5 border border-indigo-100">
              {selectedChild.photo ? (
                <img
                  src={selectedChild.photo}
                  alt={selectedChild.name}
                  className="w-5 h-5 rounded-md object-cover border border-white shadow-sm shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded-md bg-indigo-200 flex items-center justify-center shrink-0">
                  <span className="text-indigo-700 font-black text-[9px]">
                    {getInitials(selectedChild.name)}
                  </span>
                </div>
              )}
              <span className="text-xs font-bold text-slate-700">
                {selectedChild.name}
              </span>
              {selectedChild.class && (
                <span className="text-[10px] text-indigo-500 font-semibold hidden md:inline">
                  Class {selectedChild.class}
                  {selectedChild.section ? ` · ${selectedChild.section}` : ""}
                </span>
              )}
            </div>
          )}
          <button
            onClick={fetchCard}
            disabled={cardLoading || !selectedId}
            title="Refresh"
            className="w-8 h-8 md:w-9 md:h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-sm transition-all active:scale-95 disabled:opacity-40 shrink-0"
          >
            <RefreshCw
              size={13}
              className={`text-slate-500 ${cardLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {/* Loading */}
        {(childrenLoading || cardLoading) && (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Spinner />
            </div>
            <p className="text-sm text-slate-400 font-medium">
              {childrenLoading ? "Loading children…" : "Loading ID card…"}
            </p>
          </div>
        )}

        {/* No children */}
        {!childrenLoading && !cardLoading && children.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <CreditCard size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-600 font-bold text-base">
              No children linked
            </p>
            <p className="text-xs text-slate-400 mt-1.5 max-w-[220px]">
              Please contact the school admin to link your child.
            </p>
          </div>
        )}

        {/* Error */}
        {!childrenLoading && !cardLoading && cardError && (
          <div className="h-full flex items-center justify-center p-6">
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center max-w-sm w-full">
              <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={22} className="text-rose-500" />
              </div>
              <p className="text-sm font-bold text-rose-700 mb-1">
                Could not load ID card
              </p>
              <p className="text-xs text-rose-400 mb-5">{cardError}</p>
              <button
                onClick={fetchCard}
                className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-colors shadow-md shadow-rose-200"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* ── TWO COLUMN LAYOUT ── */}
        {!childrenLoading && !cardLoading && !cardError && card && (
          <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-auto">
            {/* ── LEFT: ID Card ─────────────────────────────────────────────── */}
            <div
              className="flex flex-col items-center justify-center gap-6 px-8 py-6
              bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 relative overflow-hidden"
            >
              {/* Background pattern */}
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, white 1.5px, transparent 1.5px)",
                  backgroundSize: "28px 28px",
                }}
              />
              {/* Glow blobs */}
              <div className="absolute top-0 left-0 w-64 h-64 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />

              {/* Card label */}
              <div className="relative text-center">
                <p className="text-[11px] font-black text-white/40 tracking-[0.2em] uppercase">
                  Identity Card
                </p>
              </div>

              {/* Card */}
              <div className="relative w-full max-w-[300px] mx-auto">
                <IdCardVisual card={card} />
              </div>

              {/* Action buttons */}
              <div className="relative w-full max-w-[300px] mx-auto space-y-2">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white text-indigo-700 rounded-2xl font-bold text-sm
                    hover:bg-indigo-50 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
                >
                  {downloading ? (
                    <Spinner size="sm" color="indigo" />
                  ) : (
                    <Download size={15} />
                  )}
                  {downloading ? "Downloading…" : "Download PDF"}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95 border border-white/20"
                  >
                    <Printer size={14} /> Print
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={!card.qrData}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95 border border-white/20 disabled:opacity-40"
                  >
                    <Share2 size={14} /> Share QR
                  </button>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Details ────────────────────────────────────────────── */}
            <div className="flex flex-col bg-white overflow-hidden max-h-[60vh] lg:max-h-none">
              {/* Details header */}
              <div className="flex-none px-6 py-4 border-b border-slate-100 bg-slate-50/80">
                <div className="flex items-center gap-3">
                  {card.photo ? (
                    <img
                      src={card.photo}
                      alt={card.name}
                      className="w-11 h-11 rounded-xl object-cover border-2 border-white shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shrink-0 shadow-md">
                      <span className="text-white font-black text-base">
                        {getInitials(card.name)}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-black text-slate-800 truncate">
                      {card.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {card.admissionNo && (
                        <span className="text-[11px] text-slate-400 font-semibold">
                          #{card.admissionNo}
                        </span>
                      )}
                      {card.class && (
                        <span className="text-[11px] font-bold text-indigo-500 bg-indigo-50 rounded-full px-2 py-0.5">
                          Class {card.class}
                          {card.section ? ` · ${card.section}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-50 rounded-full px-2.5 py-1 border border-emerald-100 shrink-0">
                    <CheckCircle size={11} className="text-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-600">
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto px-6 py-2">
                <DetailRow
                  icon={Hash}
                  label="Admission No."
                  value={card.admissionNo}
                  accent
                />
                <DetailRow
                  icon={BookOpen}
                  label="Class & Section"
                  value={
                    card.class
                      ? `${card.class}${card.section ? ` – ${card.section}` : ""}`
                      : null
                  }
                />
                <DetailRow
                  icon={Hash}
                  label="Roll No."
                  value={card.rollNo || null}
                />
                <DetailRow
                  icon={Calendar}
                  label="Date of Birth"
                  value={card.dob}
                  accent
                />
                <DetailRow
                  icon={Droplet}
                  label="Blood Group"
                  value={card.bloodGroup || null}
                />
                <DetailRow
                  icon={User}
                  label="Parent Name"
                  value={card.parentName}
                  accent
                />
                <DetailRow
                  icon={Phone}
                  label="Contact"
                  value={card.contactNumber}
                />
                <DetailRow icon={MapPin} label="Address" value={card.address} />
                <DetailRow
                  icon={BookOpen}
                  label="Session"
                  value={card.session}
                />
                <DetailRow
                  icon={Calendar}
                  label="Valid Till"
                  value={card.validity}
                />

                {/* QR block */}
                {card.qrCode && (
                  <div className="mt-3 bg-gradient-to-r from-slate-50 to-indigo-50/40 rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
                    <div className="p-1.5 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">
                      <img
                        src={card.qrCode}
                        alt="QR"
                        className="w-12 h-12 rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-600">
                        Verification QR Code
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                        {card.qrData}
                      </p>
                      <p className="text-[10px] text-indigo-400 font-semibold mt-1">
                        Scan to verify student identity
                      </p>
                    </div>
                  </div>
                )}

                {card.template && (
                  <p className="text-center text-[11px] text-slate-300 font-medium mt-4 pb-2">
                    Template:{" "}
                    <span className="text-slate-400">{card.template}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  );
};

export default ParentIdCardPage;
