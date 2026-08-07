import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx'; // npm install xlsx  (needed for real .xlsx export)
import { Html5Qrcode } from 'html5-qrcode';
import {
  UserCheck, UserX, Clock, TrendingUp, Edit, Users,
  Filter, RefreshCw, ChevronLeft, ChevronRight, X, Check,
  AlertCircle, Search, Calendar, BookOpen,
  BarChart2, CheckCircle2, XCircle, AlertTriangle, Loader2,
  SlidersHorizontal, FileSpreadsheet, ChevronDown, LayoutGrid, List,
  Eye, LogIn, LogOut, History, ChevronsDown, QrCode, UserPlus, Timer,
  ArrowLeft, Hourglass, TrendingDown, Info, GraduationCap, MapPin,
  ClipboardCheck, ScanLine, ChevronUp, MoreVertical, Zap
} from 'lucide-react';
import {
  getAttendanceList,
  getDailyAttendanceSummary,
  markAttendanceAPI,
  scanAttendanceAPI,
  updateAttendanceRecord,
  centerCheckInAPI,
  centerCheckOutAPI
} from '../../api/attendance';
import { getClassesAPI } from '../../api/classes';
import { getStudentsAPI } from '../../api/students';
import { listAcademicSessionsAPI } from '../../api/academicSession.api';
import { getActiveClasses, getUnmarkedClasses, getClassResolutionWarning, describeAttendanceResult, getRecordCheckOut } from '../../utils/attendanceEngine';
import { FALLBACK_SESSION_LABEL, CLASS_TYPES } from '../../utils/attendanceConstants';
import AttendanceHistoryPanel from '../../components/attendance/AttendanceHistoryPanel';

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

.adm-root{
  font-family:'Outfit',sans-serif;
  min-height:100vh;
  background:#f0f2f8;
  color:#16213e;
}

/* ── Header gradient ── */
.adm-header{
  background:linear-gradient(135deg,#0f3460 0%,#16213e 50%,#1a1a2e 100%);
  padding:24px 28px 28px;
  position:relative;
  overflow:hidden;
}
.adm-header::before{
  content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse 70% 80% at 80% -10%,rgba(83,130,255,0.25) 0%,transparent 60%),
             radial-gradient(ellipse 50% 60% at -10% 100%,rgba(16,185,129,0.15) 0%,transparent 55%);
  pointer-events:none;
}
.adm-header-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
  gap:16px;
  margin-top:20px;
}

/* ── Stat cards ── */
.stat-pill{
  background:rgba(255,255,255,0.07);
  backdrop-filter:blur(12px);
  border:1px solid rgba(255,255,255,0.12);
  border-radius:18px;
  padding:16px 18px;
  display:flex;align-items:center;gap:14px;
  transition:all 0.25s;
  position:relative;overflow:hidden;
}
.stat-pill::after{
  content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);
}
.stat-pill:hover{
  background:rgba(255,255,255,0.11);
  transform:translateY(-2px);
}
.stat-icon{
  width:44px;height:44px;border-radius:13px;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;
}
.stat-val{font-size:26px;font-weight:900;color:#fff;line-height:1;}
.stat-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.09em;color:rgba(255,255,255,0.5);}
.stat-bar-wrap{
  height:3px;border-radius:999px;
  background:rgba(255,255,255,0.12);
  margin-top:10px;overflow:hidden;
}
.stat-bar{height:100%;border-radius:999px;transition:width 0.8s cubic-bezier(0.34,1.56,0.64,1);}

/* ── Content area ── */
.adm-body{padding:20px 28px 40px;}

/* ── Filter panel ── */
.filter-panel{
  background:#fff;
  border-radius:20px;
  border:1px solid #e8ecf4;
  box-shadow:0 2px 12px rgba(15,52,96,0.07);
  padding:20px;
  margin-bottom:18px;
}
.filter-row{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
  gap:16px 12px;
  align-items:end;
}

/* ── Input / Select ── */
.adm-label{
  display:block;font-size:10.5px;font-weight:700;
  text-transform:uppercase;letter-spacing:0.07em;
  color:#6b7a99;margin-bottom:6px;
}
.adm-input,.adm-select{
  width:100%;padding:10px 13px;
  border-radius:12px;border:1.5px solid #e8ecf4;
  font-family:'Outfit',sans-serif;font-size:13px;font-weight:500;
  color:#16213e;background:#f7f9ff;outline:none;
  transition:all 0.2s;appearance:none;
}
.adm-input:focus,.adm-select:focus{
  border-color:#3b82f6;background:#fff;
  box-shadow:0 0 0 4px rgba(59,130,246,0.1);
}
.select-wrap{position:relative;}
.select-wrap svg{
  position:absolute;right:11px;top:50%;
  transform:translateY(-50%);pointer-events:none;color:#94a3b8;
}

/* ── Buttons ── */
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:7px;
  padding:10px 18px;border-radius:12px;font-family:'Outfit',sans-serif;
  font-size:13px;font-weight:700;cursor:pointer;border:none;
  transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1);white-space:nowrap;
}
.btn-primary{
  background:linear-gradient(135deg,#0f3460,#1a4080);color:#fff;
  box-shadow:0 4px 14px rgba(15,52,96,0.3),0 1px 0 rgba(255,255,255,0.1) inset;
}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(15,52,96,0.38);}
.btn-primary:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
.btn-emerald{
  background:linear-gradient(135deg,#059669,#10b981);color:#fff;
  box-shadow:0 4px 14px rgba(5,150,105,0.3);
}
.btn-emerald:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(5,150,105,0.38);}
.btn-outline{
  background:#fff;color:#475569;
  border:1.5px solid #e2e8f0;
  box-shadow:0 2px 6px rgba(0,0,0,0.04);
}
.btn-outline:hover{background:#f8fafc;transform:translateY(-1px);}
.btn-sm{padding:8px 14px;font-size:12px;}
.btn-icon{
  width:34px;height:34px;padding:0;border-radius:10px;
  background:#f1f5f9;border:1.5px solid #e2e8f0;color:#475569;
  display:inline-flex;align-items:center;justify-content:center;cursor:pointer;
  transition:all 0.2s;
}
.btn-icon:hover{background:#e2e8f0;color:#030B15;}
.btn-icon.view{background:#eff6ff;border-color:#bfdbfe;color:#0C2A47;}
.btn-icon.view:hover{background:#dbeafe;color:#0C2A47;}

.view-toggle{display:flex;border:1.5px solid #e2e8f0;border-radius:10px;overflow:hidden;}
.view-toggle button{
  width:32px;height:32px;border:none;background:#fff;color:#94a3b8;
  display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;
}
.view-toggle button.active{background:#0f3460;color:#fff;}

/* ── Table card ── */
.table-card{
  background:#fff;border-radius:20px;
  border:1px solid #e8ecf4;
  box-shadow:0 2px 12px rgba(15,52,96,0.07);
  overflow:hidden;
}
.table-header{
  padding:16px 20px;
  border-bottom:1px solid #f0f4fc;
  background:linear-gradient(90deg,#f7f9ff,#fff);
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  flex-wrap:wrap;
}
.table-title{font-size:14px;font-weight:800;color:#16213e;letter-spacing:-0.01em;}

table.att-tbl{width:100%;border-collapse:collapse;}
table.att-tbl th{
  padding:12px 16px;text-align:left;
  font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.07em;
  color:#94a3b8;background:#f7f9ff;border-bottom:1px solid #eef1f8;
  white-space:nowrap;
}
table.att-tbl td{
  padding:12px 16px;font-size:13px;font-weight:500;
  color:#374151;border-bottom:1px solid #f4f7fd;
  vertical-align:middle;
}
table.att-tbl tr:last-child td{border-bottom:none;}
table.att-tbl tr:hover td{background:#f9fbff;}

/* ── Avatar ── */
.avatar{
  width:34px;height:34px;border-radius:10px;
  display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:800;flex-shrink:0;
  background:linear-gradient(135deg,#dbeafe,#ede9fe);color:#4f46e5;
}
.avatar.lg{width:54px;height:54px;font-size:18px;border-radius:16px;}

/* ── Badges ── */
.badge{
  display:inline-flex;align-items:center;gap:4px;
  padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;border:1.5px solid;
}
.b-present{background:#ecfdf5;color:#059669;border-color:#a7f3d0;}
.b-absent{background:#fff1f2;color:#E2B94D;border-color:#fecdd3;}
.b-late{background:#fffbeb;color:#d97706;border-color:#fde68a;}
.b-leave{background:#eff6ff;color:#0C2A47;border-color:#bfdbfe;}
.b-default{background:#f8fafc;color:#64748b;border-color:#e2e8f0;}
.b-qr{background:#eff6ff;color:#0C2A47;border-color:#bfdbfe;}
.b-manual{background:#fff7ed;color:#ea580c;border-color:#fed7aa;}
.b-system{background:#f5f3ff;color:#7c3aed;border-color:#ddd6fe;}
.b-ontime{background:#ecfdf5;color:#059669;border-color:#a7f3d0;}
.b-late-p{background:#fff1f2;color:#E2B94D;border-color:#fecdd3;}
.b-early-p{background:#eff6ff;color:#0C2A47;border-color:#bfdbfe;}

/* ── Mono ── */
.mono{font-family:'JetBrains Mono',monospace;font-weight:500;}

/* ── Empty state ── */
.empty-state{padding:60px 20px;text-align:center;}
.empty-icon{
  width:72px;height:72px;border-radius:20px;
  background:linear-gradient(135deg,#f0f4ff,#e8ecff);
  display:inline-flex;align-items:center;justify-content:center;
  margin-bottom:16px;
}

/* ── Pagination ── */
.pagination{
  padding:14px 20px;
  border-top:1px solid #f0f4fc;
  display:flex;align-items:center;justify-content:space-between;
  flex-wrap:wrap;gap:10px;
  background:#fafbff;
}
.page-btn{
  width:34px;height:34px;border-radius:10px;
  border:1.5px solid #e2e8f0;background:#fff;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all 0.2s;color:#475569;
}
.page-btn:hover:not(:disabled){background:#f0f4ff;border-color:#c7d6ff;color:#0C2A47;}
.page-btn:disabled{opacity:0.35;cursor:not-allowed;}
.page-current{
  padding:0 14px;height:34px;border-radius:10px;
  background:linear-gradient(135deg,#0f3460,#1a4080);
  color:#fff;font-weight:800;font-size:13px;
  display:flex;align-items:center;
}

/* ── Modal ── */
.modal-bg{
  position:fixed;inset:0;z-index:999;
  background:rgba(15,52,96,0.55);
  backdrop-filter:blur(8px);
  display:flex;align-items:center;justify-content:center;padding:20px;
}
.modal-box{
  background:#fff;border-radius:24px;
  width:100%;max-width:460px;
  box-shadow:0 24px 80px rgba(15,52,96,0.25);
  overflow:hidden;
}
.modal-head{
  padding:20px 24px;
  background:linear-gradient(135deg,#0f3460,#16213e);
  color:#fff;
}
.modal-title{font-size:16px;font-weight:800;letter-spacing:-0.01em;}
.modal-body{padding:22px 24px;display:flex;flex-direction:column;gap:16px;}
.modal-footer{
  padding:16px 24px;border-top:1px solid #f0f4fc;
  display:flex;gap:10px;
}
.modal-textarea{
  width:100%;padding:10px 13px;
  border-radius:12px;border:1.5px solid #e8ecf4;
  font-family:'Outfit',sans-serif;font-size:13px;font-weight:500;
  color:#16213e;background:#f7f9ff;outline:none;
  resize:none;transition:all 0.2s;
}
.modal-textarea:focus{border-color:#3b82f6;background:#fff;box-shadow:0 0 0 4px rgba(59,130,246,0.1);}

/* ── Modal v2 additions (student picker / segmented status / time row) ── */
.modal-box.lg{max-width:520px;}
.modal-body-scroll{max-height:min(72vh,640px);overflow-y:auto;}
.field-block{display:flex;flex-direction:column;gap:6px;}
.field-hint{font-size:11px;color:#94a3b8;font-weight:500;margin-top:2px;}
.field-error{font-size:11px;color:#E2B94D;font-weight:700;margin-top:2px;display:flex;align-items:center;gap:4px;}

.student-picker{position:relative;}
.student-picker-input-wrap{position:relative;display:flex;align-items:center;}
.student-picker-input-wrap svg.picker-search-ic{position:absolute;left:12px;color:#94a3b8;pointer-events:none;}
.student-picker-input-wrap .adm-input{padding-left:36px;}
.student-suggest{
  position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:20;
  background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;
  box-shadow:0 14px 40px rgba(15,52,96,0.16);
  max-height:220px;overflow-y:auto;padding:6px;
}
.student-suggest-item{
  display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;
  cursor:pointer;transition:background .15s;
}
.student-suggest-item:hover{background:#f0f4ff;}
.student-suggest-empty{padding:14px;text-align:center;font-size:12px;color:#94a3b8;font-weight:600;}

.selected-student-chip{
  display:flex;align-items:center;gap:12px;
  padding:10px 12px;border-radius:14px;
  background:#eff6ff;border:1.5px solid #bfdbfe;
}
.selected-student-chip .chip-clear{
  margin-left:auto;background:rgba(255,255,255,0.7);border:1px solid #bfdbfe;
  border-radius:9px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;
  cursor:pointer;color:#0C2A47;flex-shrink:0;
}

.status-seg{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.status-seg-btn{
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;
  padding:11px 4px;border-radius:13px;border:1.5px solid #e2e8f0;background:#fff;
  cursor:pointer;transition:all .18s;color:#64748b;font-size:11.5px;font-weight:700;
}
.status-seg-btn:hover{background:#f8fafc;}
.status-seg-btn.sel-present{border-color:#a7f3d0;background:#ecfdf5;color:#059669;}
.status-seg-btn.sel-absent{border-color:#fecdd3;background:#fff1f2;color:#E2B94D;}
.status-seg-btn.sel-late{border-color:#fde68a;background:#fffbeb;color:#d97706;}
.status-seg-btn.sel-leave{border-color:#bfdbfe;background:#eff6ff;color:#0C2A47;}

.two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
@media(max-width:420px){.two-col{grid-template-columns:1fr;}}

.time-input-wrap{position:relative;}
.time-input-wrap svg.time-ic{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#94a3b8;pointer-events:none;}
.time-input-wrap .adm-input{padding-left:34px;}
.time-input-wrap .time-clear{
  position:absolute;right:8px;top:50%;transform:translateY(-50%);
  background:none;border:none;color:#94a3b8;cursor:pointer;padding:4px;display:flex;
}

.section-divider{display:flex;align-items:center;gap:8px;margin:2px 0 -4px;}
.section-divider span{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;white-space:nowrap;}
.section-divider::after{content:'';flex:1;height:1px;background:#eef1f8;}

/* ── Toast ── */
.toast-box{
  position:fixed;bottom:28px;right:24px;z-index:9999;
  padding:14px 20px;border-radius:16px;
  display:flex;align-items:center;gap:10px;
  font-size:13px;font-weight:700;font-family:'Outfit',sans-serif;
  max-width:360px;border:1px solid rgba(255,255,255,0.15);
  box-shadow:0 12px 40px rgba(0,0,0,0.2);
  animation:toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
}
@keyframes toastIn{from{opacity:0;transform:translateX(20px) scale(0.95);}to{opacity:1;transform:none;}}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;}}
.anim-up{animation:fadeUp 0.35s ease both;}

/* ── Rate ring ── */
.rate-ring{
  position:relative;width:54px;height:54px;flex-shrink:0;
}
.rate-ring svg{transform:rotate(-90deg);}
.rate-ring-num{
  position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  font-size:11px;font-weight:900;color:#fff;
}

/* ── Loader ── */
.spin{animation:spin 0.9s linear infinite;}
@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}

/* ══════════════════════════════════════════════════════════════════════════
   DETAIL PAGE (full-page "View Details" — replaces the old popup modal)
   ══════════════════════════════════════════════════════════════════════════ */
.detail-page{
  animation:fadeUp 0.3s ease both;
}
.detail-topbar{
  display:flex;align-items:center;gap:12px;flex-wrap:wrap;
  margin-bottom:16px;
}
.back-btn{
  display:inline-flex;align-items:center;gap:7px;
  padding:9px 16px 9px 12px;border-radius:12px;
  background:#fff;border:1.5px solid #e2e8f0;color:#0f3460;
  font-weight:800;font-size:13px;cursor:pointer;transition:all .2s;
  box-shadow:0 2px 8px rgba(15,52,96,0.06);
}
.back-btn:hover{background:#f0f4ff;border-color:#c7d6ff;transform:translateX(-2px);}

.dp-hero{
  background:linear-gradient(135deg,#0f3460 0%,#16213e 55%,#1a1a2e 100%);
  border-radius:24px;padding:26px 28px;position:relative;overflow:hidden;
  color:#fff;margin-bottom:18px;
}
.dp-hero::before{
  content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse 70% 90% at 85% -20%,rgba(83,130,255,0.3) 0%,transparent 60%),
             radial-gradient(ellipse 50% 60% at -10% 110%,rgba(16,185,129,0.18) 0%,transparent 55%);
  pointer-events:none;
}
.dp-hero-top{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;}
.dp-hero-id{display:flex;align-items:center;gap:16px;}
.dp-hero-name{font-size:22px;font-weight:900;letter-spacing:-0.02em;}
.dp-hero-meta{font-size:12.5px;color:rgba(255,255,255,0.6);margin-top:4px;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;}
.dp-hero-meta span{display:inline-flex;align-items:center;gap:5px;}
.dp-hero-date{
  background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.16);
  border-radius:14px;padding:10px 16px;text-align:right;
}
.dp-hero-date .d-big{font-size:15px;font-weight:800;}
.dp-hero-date .d-small{font-size:10.5px;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.07em;margin-top:2px;}

/* Timeline strip: scheduled start ── check-in ── check-out ── scheduled end */
.dp-timeline-wrap{position:relative;z-index:1;margin-top:22px;}
.dp-timeline-track{
  position:relative;height:8px;border-radius:999px;
  background:rgba(255,255,255,0.12);overflow:visible;
}
.dp-timeline-fill{
  position:absolute;top:0;bottom:0;border-radius:999px;
  background:linear-gradient(90deg,#34d399,#10b981);
}
.dp-timeline-marker{
  position:absolute;top:50%;transform:translate(-50%,-50%);
  width:16px;height:16px;border-radius:50%;border:3px solid #16213e;
  box-shadow:0 0 0 3px rgba(255,255,255,0.25);
}
.dp-timeline-labels{display:flex;justify-content:space-between;margin-top:10px;font-size:11px;color:rgba(255,255,255,0.5);font-weight:600;}
.dp-timeline-labels b{color:#fff;font-weight:800;}

.dp-stat-grid{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;
  margin-bottom:18px;
}
.dp-stat-card{
  background:#fff;border:1px solid #e8ecf4;border-radius:18px;padding:18px;
  display:flex;flex-direction:column;gap:10px;
  box-shadow:0 2px 10px rgba(15,52,96,0.05);
  position:relative;overflow:hidden;
}
.dp-stat-card .dp-stat-ic{
  width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.dp-stat-card .dp-stat-lbl{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;}
.dp-stat-card .dp-stat-val{font-size:21px;font-weight:900;color:#16213e;line-height:1.1;}
.dp-stat-card .dp-stat-sub{font-size:11.5px;color:#94a3b8;font-weight:600;}
.dp-stat-card.warn{border-color:#fde68a;background:linear-gradient(180deg,#fffdf5,#fff);}
.dp-stat-card.warn .dp-stat-val{color:#d97706;}
.dp-stat-card.good{border-color:#a7f3d0;background:linear-gradient(180deg,#f4fffb,#fff);}
.dp-stat-card.good .dp-stat-val{color:#059669;}
.dp-stat-card.info{border-color:#bfdbfe;background:linear-gradient(180deg,#f5f9ff,#fff);}
.dp-stat-card.info .dp-stat-val{color:#0C2A47;}

.dp-section{
  background:#fff;border:1px solid #e8ecf4;border-radius:20px;
  padding:20px 22px;margin-bottom:16px;
  box-shadow:0 2px 10px rgba(15,52,96,0.05);
}
.dp-section-title{
  font-size:12.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.07em;
  color:#0f3460;display:flex;align-items:center;gap:9px;margin-bottom:16px;
}
.dp-section-title .ic-badge{
  width:26px;height:26px;border-radius:8px;background:#eff6ff;color:#0C2A47;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
}

.dp-grid-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;}
.dp-compare-col{display:flex;flex-direction:column;gap:12px;}
.dp-compare-col-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;display:flex;align-items:center;gap:6px;}
.dp-compare-row{
  display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:12px 14px;border-radius:14px;background:#f7f9ff;border:1px solid #eef1f8;
}
.dp-compare-row .lbl{font-size:12px;font-weight:700;color:#64748b;display:flex;align-items:center;gap:8px;}
.dp-compare-row .val{font-size:13.5px;font-weight:800;color:#16213e;}

.dp-badge-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:4px;}

.dp-history-list{display:flex;flex-direction:column;gap:8px;}
.history-item{
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding:12px 14px;border:1px solid #eef1f8;border-radius:14px;background:#fafbff;
  flex-wrap:wrap;
}
.history-left{display:flex;align-items:center;gap:12px;}
.history-date-box{
  width:44px;height:44px;border-radius:12px;background:#fff;border:1.5px solid #e8ecf4;
  display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;
}
.history-date-box .dnum{font-size:14px;font-weight:900;color:#16213e;line-height:1;}
.history-date-box .dmon{font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;}

.view-more-btn{
  width:100%;padding:12px;border-radius:14px;border:1.5px dashed #c7d6ff;
  background:#f7f9ff;color:#0C2A47;font-weight:800;font-size:13px;
  display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;transition:all .2s;
}
.view-more-btn:hover{background:#eff6ff;border-color:#93c5fd;}
.view-more-btn:disabled{opacity:0.5;cursor:not-allowed;}

.source-chip{
  display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:10px;
  font-size:11.5px;font-weight:700;
}
.source-chip.center_session{background:#eff6ff;color:#0C2A47;}
.source-chip.cron_auto{background:#f5f3ff;color:#7c3aed;}
.source-chip.manual{background:#fff7ed;color:#ea580c;}

/* ══════════════════════════════════════════════════════════════════════════
   MARK ATTENDANCE TAB — redesigned
   ══════════════════════════════════════════════════════════════════════════ */
.mk-toolbar{
  background:#fff;border:1px solid #e8ecf4;border-radius:20px;
  box-shadow:0 2px 12px rgba(15,52,96,0.07);
  padding:16px 18px;margin-bottom:16px;
  display:flex;flex-direction:column;gap:14px;
}
.mk-toolbar-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.mk-search-wrap{position:relative;flex:1;min-width:220px;}
.mk-search-wrap svg{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#94a3b8;}
.mk-search-wrap input{
  width:100%;padding:11px 14px 11px 38px;border-radius:13px;border:1.5px solid #e8ecf4;
  font-family:'Outfit',sans-serif;font-size:13.5px;font-weight:600;color:#16213e;
  background:#f7f9ff;outline:none;transition:all .2s;
}
.mk-search-wrap input:focus{border-color:#3b82f6;background:#fff;box-shadow:0 0 0 4px rgba(59,130,246,0.1);}
.mk-chip-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
.mk-chip-select{
  padding:8px 12px;border-radius:11px;border:1.5px solid #e2e8f0;background:#f7f9ff;
  font-size:12.5px;font-weight:700;color:#475569;cursor:pointer;font-family:'Outfit',sans-serif;
}

.mk-stats-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;}
.mk-stat-chip{
  border-radius:14px;padding:11px 14px;display:flex;align-items:center;gap:10px;
  border:1.5px solid;
}
.mk-stat-chip .n{font-size:19px;font-weight:900;line-height:1;}
.mk-stat-chip .l{font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;opacity:0.75;}

.mk-layout{display:grid;grid-template-columns:1fr;gap:16px;}
@media(min-width:980px){.mk-layout{grid-template-columns:minmax(0,1fr) 320px;}}

.mk-scanner-card{
  background:linear-gradient(135deg,#0f3460,#16213e);border-radius:20px;padding:18px;
  color:#fff;position:relative;overflow:hidden;
}
.mk-scanner-card::before{
  content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse 70% 80% at 90% -10%,rgba(83,130,255,0.3) 0%,transparent 60%);
  pointer-events:none;
}
.mk-scanner-head{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;}
.mk-scanner-head .t{font-size:13px;font-weight:800;display:flex;align-items:center;gap:8px;}
.mk-scan-frame{
  position:relative;z-index:1;border-radius:16px;overflow:hidden;
  min-height:200px;background:rgba(0,0,0,0.25);
  border:1.5px dashed rgba(255,255,255,0.25);
  display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;
}
.mk-recent-card{
  background:#fff;border:1px solid #e8ecf4;border-radius:20px;padding:16px;
  box-shadow:0 2px 12px rgba(15,52,96,0.05);
}
.mk-recent-item{
  display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:11px;
  font-size:12.5px;font-weight:700;margin-bottom:6px;
}

.student-grid{
  display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px;
}
.student-card{
  background:#fff;border:1.5px solid #e8ecf4;border-radius:18px;padding:14px;
  display:flex;flex-direction:column;gap:12px;transition:all .18s;
  position:relative;
}
.student-card.sel{border-color:#93c5fd;background:#f5f9ff;box-shadow:0 0 0 3px rgba(59,130,246,0.08);}
.student-card-top{display:flex;align-items:flex-start;gap:10px;}
.student-card-name{font-weight:800;color:#16213e;font-size:13.5px;line-height:1.2;}
.student-card-sub{font-size:11px;color:#94a3b8;font-family:'JetBrains Mono',monospace;margin-top:2px;}
.student-card-check{
  width:20px;height:20px;border-radius:6px;border:1.5px solid #cbd5e1;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;background:#fff;
}
.student-card-check.on{background:#0f3460;border-color:#0f3460;color:#fff;}
.student-card-actions{display:flex;gap:6px;flex-wrap:wrap;}
.mini-act-btn{
  flex:1;min-width:0;padding:8px 6px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;
  display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;transition:all .15s;
  font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.02em;color:#64748b;
}
.mini-act-btn:hover{transform:translateY(-1px);}
.mini-act-btn.present:hover, .mini-act-btn.present.on{background:#ecfdf5;border-color:#a7f3d0;color:#059669;}
.mini-act-btn.absent:hover, .mini-act-btn.absent.on{background:#fff1f2;border-color:#fecdd3;color:#E2B94D;}
.mini-act-btn.late:hover, .mini-act-btn.late.on{background:#fffbeb;border-color:#fde68a;color:#d97706;}
.mini-act-btn.leave:hover, .mini-act-btn.leave.on{background:#eff6ff;border-color:#bfdbfe;color:#0C2A47;}
.mini-act-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
.mk-checkinout-btn{
  width:100%;padding:9px;border-radius:11px;border:none;cursor:pointer;font-weight:800;font-size:12px;
  display:flex;align-items:center;justify-content:center;gap:7px;transition:all .2s;
}
.mk-checkinout-btn.in{background:linear-gradient(135deg,#059669,#10b981);color:#fff;}
.mk-checkinout-btn.out{background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;}
.mk-checkinout-btn:hover{transform:translateY(-1px);filter:brightness(1.05);}

/* ── Responsive ── */
@media(max-width:768px){
  .adm-header,.adm-body{padding-left:16px;padding-right:16px;}
  .filter-row{grid-template-columns:1fr 1fr;}
  .hide-mobile{display:none;}
  .dp-hero{padding:20px;}
  .dp-hero-name{font-size:19px;}
}
@media(max-width:480px){
  .filter-row{grid-template-columns:1fr;}
  .adm-header-grid{grid-template-columns:1fr 1fr;}
  .stat-val{font-size:22px;}
  .dp-hero-top{flex-direction:column;}
  .dp-hero-date{text-align:left;}
  .student-grid{grid-template-columns:1fr;}
  .mk-stats-strip{grid-template-columns:repeat(2,1fr);}
}
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
const fmtDateShort = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-';
const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-';
const fmtMinutes = (m) => {
  if (m === null || m === undefined) return '—';
  const mins = Math.round(m);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), rem = mins % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
};
const fmtHHmm12 = (hhmm) => {
  if (!hhmm || hhmm === '—') return '—';
  const [h, m] = hhmm.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
};
const getId = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return String(val._id || val.id || '');
  return String(val);
};
const getStudentDisplayName = (student) =>
  student?.name || `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || 'Unknown';
const today = () => new Date().toISOString().split('T')[0];
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};
const shiftDateStr = (dateKey, n) => {
  const d = new Date(dateKey + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

const statusClass = (s) => ({ Present: 'b-present', Absent: 'b-absent', Late: 'b-late', Leave: 'b-leave' }[s] || 'b-default');
const methodClass = (m) => ({ qr: 'b-qr', manual: 'b-manual', system: 'b-system' }[m] || 'b-default');
const punctClass = (t) => ({ ontime: 'b-ontime', late: 'b-late-p', early: 'b-early-p' }[t] || 'b-default');

// Prefer the populated class name; some backend records store a raw classId
// string inside `className` when `classId` wasn't populated correctly — this
// was the root cause of the class filter silently failing to match records.
const getDisplayClassName = (rec) => rec?.classId?.name || rec?.className || rec?.classCode || '—';
const getAdmissionNo = (rec) => rec?.studentAdmissionNo || rec?.studentId?.admissionNo || '';

const GRACE_MINUTES = 5; // within this many minutes of the scheduled time counts as "On Time"

// Compares actual check-in time against the class's scheduled start time and
// works out how many minutes early/late the student was.
const computeArrivalPunctuality = (rec) => {
  const scheduledStart = rec?.classId?.startTime; // "HH:mm"
  const checkIn = rec?.checkInTime || rec?.markedAt;
  const dateKey = rec?.attendanceDateKey;
  if (!scheduledStart || !checkIn || !dateKey) {
    return { diffMinutes: null, label: 'No schedule data', type: 'unknown' };
  }
  const scheduledDate = new Date(`${dateKey}T${scheduledStart}:00+05:30`);
  const actualDate = new Date(checkIn);
  if (isNaN(scheduledDate.getTime()) || isNaN(actualDate.getTime())) {
    return { diffMinutes: null, label: '—', type: 'unknown' };
  }
  const diffMinutes = Math.round((actualDate - scheduledDate) / 60000);
  if (Math.abs(diffMinutes) <= GRACE_MINUTES) {
    return { diffMinutes, label: 'On Time', type: 'ontime' };
  }
  if (diffMinutes > 0) {
    const absMins = Math.round(diffMinutes);
    if (absMins < 60) return { diffMinutes, label: `${absMins} min late`, type: 'late' };
    const h = Math.floor(absMins / 60), rem = absMins % 60;
    return { diffMinutes, label: rem > 0 ? `${h}h ${rem}m late` : `${h}h late`, type: 'late' };
  }
  const absMins = Math.round(Math.abs(diffMinutes));
  if (absMins < 60) return { diffMinutes: absMins, label: `${absMins} min early`, type: 'early' };
  const h = Math.floor(absMins / 60), rem = absMins % 60;
  return { diffMinutes: absMins, label: rem > 0 ? `${h}h ${rem}m early` : `${h}h early`, type: 'early' };
};

// Same idea but for check-out vs the class's scheduled end time.
const computeDeparturePunctuality = (rec, sessionMap = {}) => {
  const scheduledEnd = rec?.classId?.endTime;
  const checkOut = getRecordCheckOut(rec, sessionMap);
  const dateKey = rec?.attendanceDateKey;
  if (!scheduledEnd || !checkOut || !dateKey) {
    return { diffMinutes: null, label: '—', type: 'unknown' };
  }
  const scheduledDate = new Date(`${dateKey}T${scheduledEnd}:00+05:30`);
  const actualDate = new Date(checkOut);
  if (isNaN(scheduledDate.getTime()) || isNaN(actualDate.getTime())) {
    return { diffMinutes: null, label: '—', type: 'unknown' };
  }
  const diffMinutes = Math.round((actualDate - scheduledDate) / 60000);
  if (Math.abs(diffMinutes) <= GRACE_MINUTES) {
    return { diffMinutes, label: 'Left On Time', type: 'ontime' };
  }
  if (diffMinutes < 0) {
    const absMins = Math.round(Math.abs(diffMinutes));
    if (absMins < 60) return { diffMinutes: absMins, label: `Left ${absMins} min early`, type: 'early' };
    const h = Math.floor(absMins / 60), rem = absMins % 60;
    return { diffMinutes: absMins, label: rem > 0 ? `Left ${h}h ${rem}m early` : `Left ${h}h early`, type: 'early' };
  }
  const absMins = Math.round(diffMinutes);
  if (absMins < 60) return { diffMinutes: absMins, label: `Left ${absMins} min late`, type: 'late' };
  const h = Math.floor(absMins / 60), rem = absMins % 60;
  return { diffMinutes: absMins, label: rem > 0 ? `Left ${h}h ${rem}m late` : `Left ${h}h late`, type: 'late' };
};

const StatusDot = ({ s }) => {
  const col = { Present: '#059669', Absent: '#E2B94D', Late: '#d97706', Leave: '#0C2A47' }[s] || '#94a3b8';
  return <span style={{ width: 6, height: 6, borderRadius: '50%', background: col, display: 'inline-block', flexShrink: 0 }} />;
};

const AvatarCell = ({ name, adm, size }) => {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div className={`avatar ${size === 'lg' ? 'lg' : ''}`}>{initials}</div>
      <div>
        <div style={{ fontWeight: 700, color: '#16213e', fontSize: size === 'lg' ? 16 : 13 }}>{name || '—'}</div>
        <div className="mono" style={{ fontSize: size === 'lg' ? 12 : 11, color: '#94a3b8' }}>{adm || '—'}</div>
      </div>
    </div>
  );
};

const RateRing = ({ pct }) => {
  const r = 22, circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;
  return (
    <div className="rate-ring">
      <svg width="54" height="54" viewBox="0 0 54 54">
        <circle cx="27" cy="27" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
        <circle cx="27" cy="27" r={r} fill="none" stroke="#10b981" strokeWidth="4"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dash}
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="rate-ring-num">{pct}%</div>
    </div>
  );
};

const Spinner = ({ small }) => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: small ? 20 : 48 }}>
    <div style={{ width: small ? 24 : 36, height: small ? 24 : 36, borderRadius: '50%', border: '3px solid #dbeafe', borderTopColor: '#0C2A47' }} className="spin" />
  </div>
);

const SelectWrap = ({ label, value, onChange, children }) => (
  <div>
    {label && <label className="adm-label">{label}</label>}
    <div className="select-wrap">
      <select className="adm-select" value={value} onChange={onChange}>{children}</select>
      <ChevronDown size={14} />
    </div>
  </div>
);

const PunctualityBadge = ({ punct }) => (
  <span className={`badge ${punctClass(punct.type)}`}>
    {punct.type === 'late' ? <XCircle size={11} /> : punct.type === 'early' ? <TrendingUp size={11} /> : punct.type === 'ontime' ? <CheckCircle2 size={11} /> : null}
    {punct.label}
  </span>
);

// ─── History Card Component (grid view) ───────────────────────────────────────

const HistoryCard = ({ rec, onEdit, onView, sessionMap }) => {
  const punct = computeArrivalPunctuality(rec);
  const checkOut = getRecordCheckOut(rec, sessionMap);
  return (
    <div className="anim-up" style={{
      background: '#fff',
      borderRadius: '16px',
      border: '1px solid #e8ecf4',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      boxShadow: '0 2px 8px rgba(15,52,96,0.05)',
      transition: 'all 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <AvatarCell name={rec.studentName} adm={getAdmissionNo(rec)} />
        <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
          <span className={`badge ${statusClass(rec.status)}`}>
            <StatusDot s={rec.status} /> {rec.status}
          </span>
          <p className="mono" style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{rec.attendanceDateKey || fmtDate(rec.attendanceDate)}</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <span className="badge b-default" style={{ textTransform: 'capitalize' }}>{getDisplayClassName(rec)} {rec.section ? `· ${rec.section}` : ''}</span>
        <span className={`badge ${methodClass(rec.method)}`} style={{ textTransform: 'capitalize' }}>{rec.method || '—'}</span>
        <span className="badge b-default" style={{ textTransform: 'capitalize' }}>{(rec.sessionLabel || 'Full Day').replace('_', ' ')}</span>
        {punct.type !== 'unknown' && <PunctualityBadge punct={punct} />}
      </div>

      <div style={{ borderTop: '1px solid #f4f7fd', paddingTop: '10px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: '12px', color: '#64748b' }}>
          {fmtTime(rec.checkInTime || rec.markedAt)}{checkOut ? ` – ${fmtTime(checkOut)}` : ''}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn-icon view" onClick={() => onView(rec)} title="View Full Details">
            <Eye size={14} />
          </button>
          <button className="btn-icon" onClick={() => onEdit(rec)} title="Edit Record">
            <Edit size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Full-page Student Detail View (was a popup modal — now a dedicated page) ──

const CHECKOUT_SOURCE_META = {
  center_session: { label: 'Center check-out', icon: LogOut, cls: 'center_session' },
  cron_auto: { label: 'Auto-closed at class end', icon: Timer, cls: 'cron_auto' },
  manual: { label: 'Manually entered', icon: Edit, cls: 'manual' },
};

const StudentDetailPage = ({ rec, history, historyVisible, historyLoading, onViewMore, onBack, onEdit, sessionMap }) => {
  if (!rec) return null;
  const arrival = computeArrivalPunctuality(rec);
  const departure = computeDeparturePunctuality(rec, sessionMap);
  const recCheckOut = getRecordCheckOut(rec, sessionMap);
  const recCheckIn = rec.checkInTime || rec.markedAt;
  const visibleHistory = history.slice(0, historyVisible);
  const hasMore = historyVisible < history.length;
  const sourceMeta = rec.checkoutSource ? CHECKOUT_SOURCE_META[rec.checkoutSource] : null;

  // Build the timeline: scheduled start / actual check-in / actual check-out / scheduled end
  const schedStart = rec?.classId?.startTime;
  const schedEnd = rec?.classId?.endTime;
  const dateKey = rec.attendanceDateKey;
  let timeline = null;
  if (schedStart && schedEnd && dateKey) {
    const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
    const schedStartMin = toMin(schedStart);
    const schedEndMin = toMin(schedEnd);
    const toActualMin = (iso) => {
      if (!iso) return null;
      const d = new Date(iso);
      // Render in IST wall-clock minutes for a fair comparison against classId times.
      const ist = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      return ist.getHours() * 60 + ist.getMinutes();
    };
    const inMin = toActualMin(recCheckIn);
    const outMin = toActualMin(recCheckOut);
    const allMins = [schedStartMin, schedEndMin, inMin, outMin].filter(v => v !== null && v !== undefined);
    const lo = Math.min(...allMins) - 15;
    const hi = Math.max(...allMins) + 15;
    const span = Math.max(hi - lo, 1);
    const pct = (m) => Math.min(100, Math.max(0, ((m - lo) / span) * 100));
    timeline = { schedStartMin, schedEndMin, inMin, outMin, pct };
  }

  return (
    <div className="detail-page">
      <div className="detail-topbar">
        <button className="back-btn" onClick={onBack}><ArrowLeft size={15} /> Back to records</button>
        <button className="btn btn-outline btn-sm" onClick={() => onEdit(rec)} style={{ marginLeft: 'auto' }}>
          <Edit size={13} /> Edit this record
        </button>
      </div>

      {/* Hero */}
      <div className="dp-hero">
        <div className="dp-hero-top">
          <div className="dp-hero-id">
            <div className="avatar lg" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
              {(rec.studentName || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <div className="dp-hero-name">{rec.studentName || '—'}</div>
              <div className="dp-hero-meta">
                <span className="mono"><ClipboardCheck size={12} /> {getAdmissionNo(rec) || '—'}</span>
                <span><GraduationCap size={12} /> {getDisplayClassName(rec)} {rec.section ? `· Sec ${rec.section}` : ''}</span>
                {rec.classId?.startTime && <span><Clock size={12} /> {rec.classId.startTime}–{rec.classId.endTime}</span>}
              </div>
              <div className="dp-badge-row" style={{ marginTop: 10 }}>
                <span className={`badge ${statusClass(rec.status)}`}><StatusDot s={rec.status} /> {rec.status}</span>
                <span className={`badge ${methodClass(rec.method)}`} style={{ textTransform: 'capitalize' }}>{rec.method || '—'}</span>
                <span className="badge b-default" style={{ textTransform: 'capitalize' }}>{(rec.sessionLabel || 'Full Day').replace('_', ' ')}</span>
              </div>
            </div>
          </div>
          <div className="dp-hero-date">
            <div className="d-big">{rec.attendanceDateKey || fmtDate(rec.attendanceDate)}</div>
            <div className="d-small">Attendance date</div>
          </div>
        </div>

        {timeline && (
          <div className="dp-timeline-wrap">
            <div className="dp-timeline-track">
              <div className="dp-timeline-fill" style={{
                left: `${timeline.pct(Math.min(timeline.inMin ?? timeline.schedStartMin, timeline.schedStartMin))}%`,
                right: `${100 - timeline.pct(Math.max(timeline.outMin ?? timeline.schedEndMin, timeline.schedEndMin))}%`,
              }} />
              <div className="dp-timeline-marker" style={{ left: `${timeline.pct(timeline.schedStartMin)}%`, background: '#64748b' }} title="Scheduled start" />
              <div className="dp-timeline-marker" style={{ left: `${timeline.pct(timeline.schedEndMin)}%`, background: '#64748b' }} title="Scheduled end" />
              {timeline.inMin !== null && <div className="dp-timeline-marker" style={{ left: `${timeline.pct(timeline.inMin)}%`, background: '#10b981' }} title="Actual check-in" />}
              {timeline.outMin !== null && <div className="dp-timeline-marker" style={{ left: `${timeline.pct(timeline.outMin)}%`, background: '#f59e0b' }} title="Actual check-out" />}
            </div>
            <div className="dp-timeline-labels">
              <span>Scheduled <b>{schedStart}</b></span>
              <span>In <b>{fmtTime(recCheckIn)}</b></span>
              <span>Out <b>{recCheckOut ? fmtTime(recCheckOut) : '—'}</b></span>
              <span>Scheduled <b>{schedEnd}</b></span>
            </div>
          </div>
        )}
      </div>

      {/* Stat cards: stay / scheduled / extra / flexi */}
      <div className="dp-stat-grid">
        <div className="dp-stat-card info">
          <div className="dp-stat-ic" style={{ background: '#eff6ff' }}><Hourglass size={18} color="#0C2A47" /></div>
          <div className="dp-stat-lbl">Stay Duration</div>
          <div className="dp-stat-val">{rec.stayMinutes != null ? fmtMinutes(rec.stayMinutes) : '—'}</div>
          <div className="dp-stat-sub">{recCheckIn ? fmtTime(recCheckIn) : '—'} → {recCheckOut ? fmtTime(recCheckOut) : 'still in'}</div>
        </div>
        <div className="dp-stat-card">
          <div className="dp-stat-ic" style={{ background: '#f5f3ff' }}><BookOpen size={18} color="#7c3aed" /></div>
          <div className="dp-stat-lbl">Scheduled Class Time</div>
          <div className="dp-stat-val">{rec.scheduledMinutes != null ? fmtMinutes(rec.scheduledMinutes) : (schedStart && schedEnd ? fmtMinutes((() => { const [sh, sm] = schedStart.split(':').map(Number); const [eh, em] = schedEnd.split(':').map(Number); return (eh * 60 + em) - (sh * 60 + sm); })()) : '—')}</div>
          <div className="dp-stat-sub">{schedStart && schedEnd ? `${schedStart} – ${schedEnd}` : 'No class schedule'}</div>
        </div>
        <div className={`dp-stat-card ${rec.extraMinutes > 15 ? 'warn' : rec.extraMinutes != null ? 'good' : ''}`}>
          <div className="dp-stat-ic" style={{ background: rec.extraMinutes > 15 ? '#fffbeb' : '#ecfdf5' }}>
            {rec.extraMinutes > 15 ? <AlertTriangle size={18} color="#d97706" /> : <TrendingDown size={18} color="#059669" />}
          </div>
          <div className="dp-stat-lbl">Extra / Idle Time</div>
          <div className="dp-stat-val">{rec.extraMinutes != null ? fmtMinutes(rec.extraMinutes) : '—'}</div>
          <div className="dp-stat-sub">{rec.extraMinutes > 15 ? 'Beyond the 15-min grace period' : rec.extraMinutes != null ? 'Within grace period' : 'Not tracked for this entry'}</div>
        </div>
        <div className={`dp-stat-card ${rec.flexiHoursDeducted > 0 ? 'warn' : ''}`}>
          <div className="dp-stat-ic" style={{ background: rec.flexiHoursDeducted > 0 ? '#fffbeb' : '#f8fafc' }}><Zap size={18} color={rec.flexiHoursDeducted > 0 ? '#d97706' : '#94a3b8'} /></div>
          <div className="dp-stat-lbl">Flexi Hours Deducted</div>
          <div className="dp-stat-val">{rec.flexiHoursDeducted > 0 ? `${rec.flexiHoursDeducted.toFixed(2)} hrs` : 'None'}</div>
          <div className="dp-stat-sub">Billed against the student's flexi-hour balance</div>
        </div>
      </div>

      {/* Arrival / Departure comparison */}
      <div className="dp-section">
        <div className="dp-section-title"><span className="ic-badge"><TrendingUp size={14} /></span> Scheduled vs. Actual</div>
        <div className="dp-grid-2">
          <div className="dp-compare-col">
            <div className="dp-compare-col-title"><LogIn size={13} /> Arrival</div>
            <div className="dp-compare-row"><span className="lbl"><Clock size={13} /> Scheduled start</span><span className="val mono">{fmtHHmm12(schedStart) || '—'}</span></div>
            <div className="dp-compare-row"><span className="lbl"><LogIn size={13} /> Actual check-in</span><span className="val mono">{fmtTime(recCheckIn)}</span></div>
            <PunctualityBadge punct={arrival} />
          </div>
          <div className="dp-compare-col">
            <div className="dp-compare-col-title"><LogOut size={13} /> Departure</div>
            <div className="dp-compare-row"><span className="lbl"><Clock size={13} /> Scheduled end</span><span className="val mono">{fmtHHmm12(schedEnd) || '—'}</span></div>
            <div className="dp-compare-row"><span className="lbl"><LogOut size={13} /> Actual check-out</span><span className="val mono">{recCheckOut ? fmtTime(recCheckOut) : 'Not checked out'}</span></div>
            {recCheckOut ? <PunctualityBadge punct={departure} /> : <span className="badge b-default">Awaiting checkout</span>}
          </div>
        </div>
      </div>

      {/* Record details */}
      <div className="dp-section">
        <div className="dp-section-title"><span className="ic-badge"><Calendar size={14} /></span> Record Details</div>
        <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
          <div className="detail-item" style={{ background: '#f7f9ff', border: '1px solid #e8ecf4', borderRadius: 14, padding: '12px 14px' }}>
            <div className="detail-label" style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: 4 }}>Marked By</div>
            <div className="detail-value" style={{ fontSize: 14, fontWeight: 700, color: '#16213e' }}>{rec.markedBy?.name || '—'}</div>
          </div>
          <div className="detail-item" style={{ background: '#f7f9ff', border: '1px solid #e8ecf4', borderRadius: 14, padding: '12px 14px' }}>
            <div className="detail-label" style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: 4 }}>Auto Checked-Out</div>
            <div className="detail-value" style={{ fontSize: 14, fontWeight: 700, color: '#16213e' }}>{rec.isAutoCheckedOut ? 'Yes' : 'No'}</div>
          </div>
          {sourceMeta && (
            <div className="detail-item" style={{ background: '#f7f9ff', border: '1px solid #e8ecf4', borderRadius: 14, padding: '12px 14px' }}>
              <div className="detail-label" style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: 4 }}>Checked Out Via</div>
              <span className={`source-chip ${sourceMeta.cls}`}><sourceMeta.icon size={13} /> {sourceMeta.label}</span>
            </div>
          )}
          <div className="detail-item" style={{ background: '#f7f9ff', border: '1px solid #e8ecf4', borderRadius: 14, padding: '12px 14px', gridColumn: '1 / -1' }}>
            <div className="detail-label" style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: 4 }}>Remarks</div>
            <div className="detail-value" style={{ fontSize: 14, fontWeight: 500, color: '#16213e' }}>{rec.remarks || <span style={{ color: '#94a3b8' }}>No remarks</span>}</div>
          </div>
        </div>
      </div>

      {/* Class schedule */}
      {rec.classId && (
        <div className="dp-section">
          <div className="dp-section-title"><span className="ic-badge"><BookOpen size={14} /></span> Class Schedule</div>
          <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
            {[
              ['Class', rec.classId.name || '—'],
              ['Class Type', (rec.classId.classType || '—').toString().replace('_', ' ').toLowerCase()],
              ['Start Time', rec.classId.startTime || '—'],
              ['End Time', rec.classId.endTime || '—'],
            ].map(([lbl, val]) => (
              <div key={lbl} className="detail-item" style={{ background: '#f7f9ff', border: '1px solid #e8ecf4', borderRadius: 14, padding: '12px 14px' }}>
                <div className="detail-label" style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: 4 }}>{lbl}</div>
                <div className="detail-value mono" style={{ fontSize: 14, fontWeight: 700, color: '#16213e', textTransform: lbl === 'Class Type' ? 'capitalize' : 'none' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div className="dp-section">
        <div className="dp-section-title"><span className="ic-badge"><History size={14} /></span> Previous Attendance History</div>
        {historyLoading && history.length === 0 ? (
          <Spinner small />
        ) : history.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>
            No previous attendance records found for this student
          </div>
        ) : (
          <div className="dp-history-list">
            {visibleHistory.map((h, i) => {
              const hPunct = computeArrivalPunctuality(h);
              const hCheckOut = getRecordCheckOut(h, sessionMap);
              const dateObj = h.attendanceDateKey ? new Date(h.attendanceDateKey + 'T00:00:00') : null;
              return (
                <div className="history-item" key={h._id || i}>
                  <div className="history-left">
                    <div className="history-date-box">
                      <div className="dnum">{dateObj ? dateObj.getDate() : '—'}</div>
                      <div className="dmon">{dateObj ? dateObj.toLocaleDateString('en-IN', { month: 'short' }) : ''}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#16213e' }}>{h.attendanceDateKey || fmtDate(h.attendanceDate)}</div>
                      <div className="mono" style={{ fontSize: 11, color: '#94a3b8' }}>
                        In: {fmtTime(h.checkInTime || h.markedAt)}{hCheckOut ? ` · Out: ${fmtTime(hCheckOut)}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span className={`badge ${statusClass(h.status)}`}><StatusDot s={h.status} /> {h.status}</span>
                    {hPunct.type !== 'unknown' && <PunctualityBadge punct={hPunct} />}
                  </div>
                </div>
              );
            })}
            {hasMore && (
              <button className="view-more-btn" onClick={onViewMore} disabled={historyLoading}>
                {historyLoading ? <Loader2 size={15} className="spin" /> : <ChevronsDown size={15} />}
                View More (+4 days) · {history.length - historyVisible} more available
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit History */}
      {rec.editHistory && rec.editHistory.length > 0 && (
        <div className="dp-section">
          <div className="dp-section-title"><span className="ic-badge"><History size={14} /></span> Edit History</div>
          <AttendanceHistoryPanel history={rec.editHistory} variant="admin" />
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminAttendancePage = () => {
  // State
  const [allRecords, setAllRecords] = useState([]); // raw records fetched for the current date range
  const [totalStudents, setTotalStudents] = useState(0);  // real school-strength count, from /students API
  const [totalStuLoading, setTotalStuLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [academicSessions, setAcademicSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('mark');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [formData, setFormData] = useState({
    studentId: '', studentDisplay: '', studentAdm: '',
    status: 'Present', sessionLabel: FALLBACK_SESSION_LABEL, remarks: '',
    attendanceDate: today(), checkInTime: '', checkOutTime: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false); // For modal save
  // Student picker (used only when adding a brand-new manual record)
  const [modalStudentList, setModalStudentList] = useState([]);
  const [modalStudentListLoading, setModalStudentListLoading] = useState(false);
  const [studentPickerOpen, setStudentPickerOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [markLoading, setMarkLoading] = useState(false);
  const [markSaving, setMarkSaving] = useState(false);
  const [markDate, setMarkDate] = useState(today());
  const [markSession, setMarkSession] = useState(FALLBACK_SESSION_LABEL);
  const [markClass, setMarkClass] = useState('');
  const [markSection, setMarkSection] = useState('');
  const [markSearch, setMarkSearch] = useState('');
  const [markStudents, setMarkStudents] = useState([]);
  const [markAttendanceMap, setMarkAttendanceMap] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [bulkSelected, setBulkSelected] = useState([]);
  const [recentActions, setRecentActions] = useState([]);
  const [checkedInStudents, setCheckedInStudents] = useState([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  // Live cache of Center Session checkouts (studentId[/_dateKey] -> outTime),
  // populated straight from the center-checkout API response. This is what
  // lets the checkout time show up immediately everywhere in the UI, even
  // before the next backend re-fetch lands. See getRecordCheckOut().
  const [checkoutSessions, setCheckoutSessions] = useState({});
  const [resolutionWarning, setResolutionWarning] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const toastTimer = useRef(null);
  const scannerRef = useRef(null);

  const [historyView, setHistoryView] = useState('table'); // 'table' or 'grid'

  // View (full detail PAGE) state — no longer a popup modal
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRec, setViewRec] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(4);

  const [filters, setFilters] = useState({
    dateFrom: today(),
    dateTo: today(),
    status: '',
    className: '',
    section: '',
    sessionLabel: '',
    sessionId: '',
    search: '',
    page: 1,
    limit: 20,
  });

  // Active filters (applied on button click)
  const [applied, setApplied] = useState({ ...filters });

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ message, type, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch total students (real school-strength, from /students API) ────────
  const fetchTotalStudents = useCallback(async () => {
    setTotalStuLoading(true);
    try {
      const res = await getStudentsAPI({
        status: 'Active',
        limit: 1, // we only need the `total` count, not the actual list
        ...(applied.className && { className: applied.className }),
        ...(applied.section && { section: applied.section }),
      });
      const body = res?.data || {};
      setTotalStudents(body.total ?? 0);
    } catch {
      setTotalStudents(0);
    } finally {
      setTotalStuLoading(false);
    }
  }, [applied.className, applied.section]);

  // ── Fetch attendance list ─────────────────────────────────────────────────
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAttendanceList({
        page: 1,
        limit: 5000,
        dateFrom: applied.dateFrom,
        dateTo: applied.dateTo,
      });
      setAllRecords(res?.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to load attendance records', 'error');
      setAllRecords([]);
    } finally { setLoading(false); }
  }, [applied.dateFrom, applied.dateTo]);

  // ── Fetch classes for filter ───────────────────────────────────────────────
  const fetchClasses = useCallback(async () => {
    try {
      const res = await getClassesAPI();
      setClasses(res?.data || []);
    } catch { }
  }, []);

  // ── Fetch academic sessions for filter ─────────────────────────────────────
  const fetchAcademicSessions = useCallback(async () => {
    try {
      const res = await listAcademicSessionsAPI();
      setAcademicSessions(res?.data || []);
    } catch { }
  }, []);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => { fetchClasses(); }, [fetchClasses]);
  useEffect(() => { fetchAcademicSessions(); }, [fetchAcademicSessions]);
  useEffect(() => { fetchRecords(); }, [fetchRecords]);
  useEffect(() => { fetchTotalStudents(); }, [fetchTotalStudents]);
  useEffect(() => {
    if (activeTab === 'mark') {
      fetchMarkRoster();
    }
  }, [activeTab, markClass, markSection, markDate, markSession]);
  useEffect(() => {
    if (activeTab === 'history') {
      fetchDailySummary();
    }
  }, [activeTab, applied.dateTo]);
  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => { });
      }
    };
  }, []);

  // ── Client-side filtering (this is what actually fixes the filters) ────────
  const filteredRecords = useMemo(() => {
    let list = allRecords;

    if (applied.status) {
      list = list.filter(r => r.status === applied.status);
    }
    if (applied.className) {
      list = list.filter(r => getDisplayClassName(r) === applied.className);
    }
    if (applied.section) {
      const q = applied.section.trim().toLowerCase();
      list = list.filter(r => (r.section || '').toLowerCase().includes(q));
    }
    if (applied.sessionLabel) {
      list = list.filter(r => (r.sessionLabel || 'FULL_DAY') === applied.sessionLabel);
    }
    if (applied.sessionId) {
      list = list.filter(r => (r.sessionId?._id || r.sessionId) === applied.sessionId);
    }
    if (applied.search) {
      const q = applied.search.trim().toLowerCase();
      list = list.filter(r =>
        (r.studentName || '').toLowerCase().includes(q) ||
        getAdmissionNo(r).toLowerCase().includes(q)
      );
    }
    return list;
  }, [allRecords, applied.status, applied.className, applied.section, applied.sessionLabel, applied.sessionId, applied.search]);

  const total = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(total / applied.limit));

  const filteredMarkStudents = useMemo(() => {
    const q = markSearch.trim().toLowerCase();
    if (!q) return markStudents;
    return markStudents.filter(student => {
      const name = getStudentDisplayName(student).toLowerCase();
      const adm = (student?.admissionNo || student?.enrollmentId || '').toLowerCase();
      return name.includes(q) || adm.includes(q);
    });
  }, [markStudents, markSearch]);

  const pageRecords = useMemo(() => {
    const start = (applied.page - 1) * applied.limit;
    return filteredRecords.slice(start, start + applied.limit);
  }, [filteredRecords, applied.page, applied.limit]);

  // Distinct sections found in the loaded date range, used for the datalist helper
  const sectionOptions = useMemo(
    () => [...new Set(allRecords.map(r => r.section).filter(Boolean))],
    [allRecords]
  );

  // ── Apply filters ─────────────────────────────────────────────────────────
  const applyFilters = () => setApplied({ ...filters, page: 1 });
  const resetFilters = () => {
    const def = { dateFrom: today(), dateTo: today(), status: '', className: '', section: '', sessionLabel: '', sessionId: '', search: '', page: 1, limit: 20 };
    setFilters(def);
    setApplied(def);
  };

  const fetchMarkRoster = useCallback(async () => {
    setMarkLoading(true);
    try {
      const [studentRes, attRes] = await Promise.all([
        getStudentsAPI({ status: 'Active', limit: 1000, ...(markClass && { className: markClass }), ...(markSection && { section: markSection }) }),
        getAttendanceList({ page: 1, limit: 1000, date: markDate, sessionLabel: markSession })
      ]);
      const studentList = studentRes?.data?.data || studentRes?.data?.students || studentRes?.data || [];
      const attList = attRes?.data || [];
      const map = {};
      attList.forEach(rec => {
        const key = getId(rec.studentId);
        if (key) map[key] = rec;
      });
      setMarkStudents(Array.isArray(studentList) ? studentList : []);
      setMarkAttendanceMap(map);
      if (!selectedStudent) {
        setSelectedStudent(Array.isArray(studentList) && studentList.length ? studentList[0] : null);
      }
    } catch {
      setMarkStudents([]);
      setMarkAttendanceMap({});
    } finally {
      setMarkLoading(false);
    }
  }, [markClass, markSection, markDate, markSession, selectedStudent]);

  const fetchDailySummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await getDailyAttendanceSummary(applied.dateTo || today());
      if (res?.success) setSummary(res.data);
      else if (res?.data) setSummary(res.data);
      else setSummary(res);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [applied.dateTo]);

  const addRecentAction = useCallback((message, type = 'success') => {
    setRecentActions(prev => [{ id: Date.now(), message, type }, ...prev].slice(0, 6));
  }, []);

  const startCamera = () => {
    setIsScanning(true);
    setCameraError('');
    setTimeout(() => {
      const qr = new Html5Qrcode('admin-qr-reader');
      scannerRef.current = qr;
      qr.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 } }, handleQRScan, () => { }).catch(() => {
        setCameraError('Camera access denied. Check browser permissions.');
        setIsScanning(false);
      });
    }, 200);
  };

  const stopCamera = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch { }
    }
    scannerRef.current = null;
    setIsScanning(false);
  }, []);

  const handleQRScan = useCallback(async (decoded) => {
    if (markSaving || !scannerRef.current?.isScanning) return;
    setMarkSaving(true);
    try {
      const res = await scanAttendanceAPI(decoded, markDate, markSession);
      if (res?.success) {
        const d = res.data || {};
        const att = d.attendance || {};
        const studentId = getId(att.studentId ?? d.student?.id ?? d.student?._id);
        const student = markStudents.find(item => getId(item._id || item.id) === studentId) || selectedStudent || d.student || null;
        const displayName = att.studentName || student?.name || d.student?.fullName || 'Student';
        const status = att.status || 'Present';
        const activeClasses = getActiveClasses(student || { classIds: [], classTimings: {} }, classes, new Date());
        const todayRecords = await getAttendanceList({ studentId, date: markDate, limit: 200 }).catch(() => ({ data: [] }));
        const todayList = Array.isArray(todayRecords?.data) ? todayRecords.data : Array.isArray(todayRecords) ? todayRecords : [];
        const unmarkedClasses = getUnmarkedClasses(activeClasses, todayList);
        const warning = getClassResolutionWarning(student || {}, 'admin', classes);
        setResolutionWarning(warning);
        setMarkAttendanceMap(prev => ({ ...prev, [studentId]: { ...prev[studentId], _id: att._id, studentId, status, method: att.method || 'qr', attendanceDateKey: markDate } }));
        setSelectedStudent(student || selectedStudent);
        const result = describeAttendanceResult('MARKED', { name: displayName });
        addRecentAction(result.message, 'success');
        showToast(result.message, 'success');
        if (studentId) {
          void (async () => {
            try {
              const checkInRes = await centerCheckInAPI(decoded, studentId);
              const alreadyIn = /already checked in/i.test(checkInRes?.message || checkInRes?.error || '');
              if (checkInRes?.success || alreadyIn) {
                setCheckedInStudents(prev => prev.includes(studentId) ? prev : [...prev, studentId]);
                if (!alreadyIn) {
                  const checkedInResult = describeAttendanceResult('CHECKED_IN', { name: displayName });
                  addRecentAction(checkedInResult.message, 'success');
                }
                for (const entry of unmarkedClasses.filter(item => item.classType === CLASS_TYPES.HOURS_BASED)) {
                  try { await scanAttendanceAPI(decoded, markDate, entry.sessionLabel); } catch {}
                }
              }
            } catch (err) {
              const msg = err?.response?.data?.error || err?.response?.data?.message || '';
              if (!/already checked in/i.test(msg)) showToast(msg || 'Check-in warning', 'error');
            }
          })();
        }
        await stopCamera();
      } else {
        const result = describeAttendanceResult('INVALID_QR');
        showToast(result.message, 'error');
      }
    } catch (err) {
      const result = describeAttendanceResult('NETWORK_ERROR');
      showToast(result.message, 'error');
    } finally {
      setMarkSaving(false);
    }
  }, [addRecentAction, markDate, markSession, markSaving, markStudents, selectedStudent, showToast, stopCamera]);

  const handleMarkStudent = async (student, status) => {
    if (markSaving) return;
    const studentId = getId(student._id || student.id);
    const displayName = getStudentDisplayName(student);
    setMarkSaving(true);
    try {
      const res = await markAttendanceAPI(studentId, status, markDate, '', markSession);
      if (res?.success) {
        const att = res.data?.attendance || {};
        setMarkAttendanceMap(prev => ({ ...prev, [studentId]: { ...prev[studentId], _id: att._id, studentId, status: att.status || status, method: att.method || 'manual', attendanceDateKey: markDate } }));
        setSelectedStudent(student);
        const result = describeAttendanceResult('MARKED', { name: displayName });
        addRecentAction(result.message, 'success');
        showToast(result.message, 'success');
      } else {
        showToast(res?.message || 'Failed to mark attendance', 'error');
      }
    } catch {
      showToast('Error marking attendance', 'error');
    } finally {
      setMarkSaving(false);
    }
  };

  const handleCheckIn = async (student) => {
    const studentId = getId(student._id || student.id);
    try {
      const res = await centerCheckInAPI(null, studentId);
      if (res?.success || /already checked in/i.test(res?.message || res?.error || '')) {
        setCheckedInStudents(prev => prev.includes(studentId) ? prev : [...prev, studentId]);
        showToast(`${getStudentDisplayName(student)} checked in`, 'success');
        await fetchDailySummary();
      } else {
        showToast(res?.message || 'Check-in failed', 'error');
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Check-in failed';
      if (/already checked in/i.test(msg)) {
        setCheckedInStudents(prev => prev.includes(studentId) ? prev : [...prev, studentId]);
        showToast(`${getStudentDisplayName(student)} already checked in`, 'success');
      } else {
        showToast(msg, 'error');
      }
    }
  };

  const handleCheckOut = async (student) => {
    const studentId = getId(student._id || student.id);
    try {
      const res = await centerCheckOutAPI(null, studentId);
      if (res?.success) {
        // Backend is the single source of truth for the checkout time.
        // Only session.outTime is trusted here — never updatedAt/createdAt
        // or the attendance record's own timestamp, which reflect the
        // Attendance collection, not the Center Session.
        const outTime = res?.data?.session?.outTime;
        const mins = Math.floor(res?.data?.math?.totalStayMinutes ?? 0);
        const deducted = res?.data?.math?.deductedHours ?? 0;
        const outTimeLabel = outTime ? fmtTime(outTime) : null;
        const todayKey = markDate || today();

        setCheckedInStudents(prev => prev.filter(id => id !== studentId));
        if (outTime && studentId) {
          setCheckoutSessions(prev => ({
            ...prev,
            [studentId]: { outTime },
            [`${studentId}_${todayKey}`]: { outTime },
          }));
        }

        const displayName = getStudentDisplayName(student);
        const base = outTimeLabel
          ? `${displayName} checked out at ${outTimeLabel} • stayed ${mins} min`
          : `Checked out • stayed ${mins} min`;
        showToast(deducted > 0 ? `${base} • ${deducted} flexi-hrs deducted` : base, 'success');
        addRecentAction(base, 'success');

        // Never rely on stale local state after a mutation — re-pull
        // Attendance, Center Session (checked-in list) and the daily
        // summary from the backend so every dependent view (roster,
        // history table, reports) reflects the true, current state.
        await Promise.all([
          fetchRecords(),
          fetchTotalStudents(),
          fetchDailySummary(),
          fetchMarkRoster(),
        ]);
      } else {
        showToast(res?.message || 'Check-out failed', 'error');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Check-out failed', 'error');
    }
  };

  const markBulk = async (status) => {
    if (bulkSelected.length === 0) { showToast('Select students first', 'info'); return; }
    setMarkSaving(true);
    let ok = 0;
    for (const studentId of bulkSelected) {
      try {
        const res = await markAttendanceAPI(studentId, status, markDate, '', markSession);
        if (res?.success) {
          const att = res.data?.attendance || {};
          setMarkAttendanceMap(prev => ({ ...prev, [studentId]: { ...prev[studentId], _id: att._id, status: att.status || status, method: att.method || 'manual', attendanceDateKey: markDate } }));
          ok += 1;
        }
      } catch { }
    }
    setMarkSaving(false);
    setBulkSelected([]);
    showToast(`Marked ${ok}/${bulkSelected.length} students as ${status}`, 'success');
  };

  // ── Mark / Update attendance ───────────────────────────────────────────────
  const blankFormData = () => ({
    studentId: '', studentDisplay: '', studentAdm: '',
    status: 'Present', sessionLabel: FALLBACK_SESSION_LABEL, remarks: '',
    attendanceDate: today(), checkInTime: '', checkOutTime: '', note: '',
  });

  const validateForm = () => {
    const errs = {};
    if (!editRec && !formData.studentId.trim()) errs.studentId = 'Please select a student';
    if (!formData.attendanceDate) errs.attendanceDate = 'Date is required';
    if (formData.checkInTime && formData.checkOutTime && formData.checkOutTime <= formData.checkInTime) {
      errs.checkOutTime = 'Check-out must be after check-in';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const dateKey = formData.attendanceDate || today();
      const checkInTime = formData.checkInTime ? new Date(`${dateKey}T${formData.checkInTime}:00`).toISOString() : null;
      const checkOutTime = formData.checkOutTime ? new Date(`${dateKey}T${formData.checkOutTime}:00`).toISOString() : null;

      if (editRec) {
        const payload = {
          attendanceDate: formData.attendanceDate,
          status: formData.status,
          sessionLabel: formData.sessionLabel,
          remarks: formData.remarks,
          note: formData.note,
          // Explicit null means "the admin cleared this field in the form" — send
          // null so the backend can $unset it. Only omit the key entirely if the
          // admin never touched the field AND the original record also had no
          // value (nothing to clear, nothing to set) — otherwise always include it.
          checkInTime: formData.checkInTime ? checkInTime : null,
          checkOutTime: formData.checkOutTime ? checkOutTime : null,
        };
        const res = await updateAttendanceRecord(editRec._id, payload);
        if (res?.success) {
          showToast('Attendance updated!'); closeModal(); fetchRecords(); fetchTotalStudents();
          // If we updated the record currently open in the detail page, refresh it in place.
          if (viewRec && viewRec._id === editRec._id && res?.data) setViewRec(res.data);
        }
        else showToast(res?.message || 'Update failed', 'error');
      } else {
        // Mirrors POST /api/attendance/manual — studentId, status, attendanceDate,
        // sessionLabel, remarks, method:'manual' plus optional checkInTime/checkOutTime.
        const res = await markAttendanceAPI(formData.studentId, formData.status, dateKey, formData.remarks, formData.sessionLabel, {
          method: 'manual',
          checkInTime,
          checkOutTime,
        });
        if (res?.success) { showToast('Attendance marked!'); closeModal(); fetchRecords(); fetchTotalStudents(); }
        else showToast(res?.message || 'Marking attendance failed', 'error');
      }
    } catch (e) { showToast(e?.response?.data?.message || 'Something went wrong', 'error'); }
    finally { setSaving(false); }
  };

  // Opens the modal to create a brand-new manual attendance record (POST flow).
  // Lazily loads the active student roster once so the picker has data to search.
  const openAddNew = async () => {
    setEditRec(null);
    setFormErrors({});
    setFormData(blankFormData());
    setStudentPickerOpen(false);
    setModalOpen(true);
    if (modalStudentList.length === 0) {
      setModalStudentListLoading(true);
      try {
        const res = await getStudentsAPI({ status: 'Active', limit: 1000 });
        const list = res?.data?.data || res?.data?.students || res?.data || [];
        setModalStudentList(Array.isArray(list) ? list : []);
      } catch {
        setModalStudentList([]);
      } finally {
        setModalStudentListLoading(false);
      }
    }
  };

  // Opens the modal to edit an existing record (PUT flow).
  const openEdit = (rec) => {
    setEditRec(rec);
    setFormErrors({});
    const dateKey = rec.attendanceDateKey || (rec.attendanceDate ? rec.attendanceDate.split('T')[0] : today());
    const recCheckOut = getRecordCheckOut(rec, checkoutSessions);
    setFormData({
      studentId: rec.studentId?._id || rec.studentId || '',
      studentDisplay: rec.studentName || '',
      studentAdm: getAdmissionNo(rec),
      status: rec.status,
      sessionLabel: rec.sessionLabel || 'FULL_DAY',
      remarks: rec.remarks || '',
      attendanceDate: dateKey,
      checkInTime: (rec.checkInTime || rec.markedAt) ? new Date(rec.checkInTime || rec.markedAt).toTimeString().slice(0, 5) : '',
      checkOutTime: recCheckOut ? new Date(recCheckOut).toTimeString().slice(0, 5) : '',
      note: '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditRec(null);
    setFormErrors({});
    setStudentPickerOpen(false);
    setFormData(blankFormData());
  };

  const selectStudentForModal = (student) => {
    setFormData(f => ({
      ...f,
      studentId: getId(student._id || student.id),
      studentDisplay: getStudentDisplayName(student),
      studentAdm: student.admissionNo || student.enrollmentId || '',
    }));
    setFormErrors(e => ({ ...e, studentId: undefined }));
    setStudentPickerOpen(false);
  };

  const clearSelectedStudent = () => {
    setFormData(f => ({ ...f, studentId: '', studentDisplay: '', studentAdm: '' }));
  };

  const modalStudentMatches = useMemo(() => {
    const q = (formData.studentDisplay || '').trim().toLowerCase();
    if (!q) return modalStudentList.slice(0, 30);
    return modalStudentList.filter(s => {
      const name = getStudentDisplayName(s).toLowerCase();
      const adm = (s.admissionNo || s.enrollmentId || '').toLowerCase();
      return name.includes(q) || adm.includes(q);
    }).slice(0, 30);
  }, [modalStudentList, formData.studentDisplay]);

  // ── View full details + attendance history (now navigates to a full page) ──
  const openView = async (rec) => {
    setViewRec(rec);
    setViewOpen(true);
    setHistoryVisible(4);
    setStudentHistory([]);
    setHistoryLoading(true);
    // Scroll to top so the detail page is visible immediately, like a real page nav.
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const admNo = getAdmissionNo(rec);
      const anchorDate = rec.attendanceDateKey || (rec.attendanceDate ? rec.attendanceDate.split('T')[0] : today());
      const toDate = shiftDateStr(anchorDate, -1); // history is everything before this record's date
      const fromDate = shiftDateStr(anchorDate, -60); // look back up to 60 days

      const res = await getAttendanceList({ page: 1, limit: 1000, dateFrom: fromDate, dateTo: toDate });
      const list = (res?.data || [])
        .filter(r => admNo && getAdmissionNo(r) === admNo)
        .sort((a, b) => new Date(b.attendanceDate) - new Date(a.attendanceDate));
      setStudentHistory(list);
    } catch {
      setStudentHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeView = () => { setViewOpen(false); setViewRec(null); setStudentHistory([]); setHistoryVisible(4); };
  const loadMoreHistory = () => setHistoryVisible(v => v + 4);

  // ── Export to Excel (.xlsx) — exports exactly what's currently filtered ────
  const exportExcel = () => {
    if (exporting) return;
    if (!filteredRecords.length) { showToast('No records to export', 'error'); return; }
    setExporting(true);
    try {
      const rows = filteredRecords.map(r => {
        const arrival = computeArrivalPunctuality(r);
        const departure = computeDeparturePunctuality(r, checkoutSessions);
        const recCheckOut = getRecordCheckOut(r, checkoutSessions);
        return {
          'Student Name': r.studentName || '',
          'Admission No': getAdmissionNo(r),
          'Class': getDisplayClassName(r),
          'Section': r.section || '',
          'Date': r.attendanceDateKey || fmtDate(r.attendanceDate),
          'Session': (r.sessionLabel || 'FULL_DAY').replace('_', ' '),
          'Status': r.status || '',
          'Method': r.method || '',
          'Scheduled Start': r.classId?.startTime || '',
          'Check-In Time': r.checkInTime ? fmtTime(r.checkInTime) : (r.markedAt ? fmtTime(r.markedAt) : ''),
          'Arrival': arrival.label,
          'Scheduled End': r.classId?.endTime || '',
          'Check-Out Time': recCheckOut ? fmtTime(recCheckOut) : '',
          'Departure': recCheckOut ? departure.label : '',
          'Stay Duration (min)': r.stayMinutes ?? '',
          'Extra/Idle (min)': r.extraMinutes ?? '',
          'Flexi Hours Deducted': r.flexiHoursDeducted || '',
          'Marked By': r.markedBy?.name || '',
          'Remarks': r.remarks || '',
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 12 },
        { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 13 }, { wch: 13 },
        { wch: 15 }, { wch: 13 }, { wch: 13 }, { wch: 16 }, { wch: 14 }, { wch: 13 }, { wch: 12 }, { wch: 18 }, { wch: 26 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
      XLSX.writeFile(wb, `attendance_${applied.dateFrom}_to_${applied.dateTo}.xlsx`);
      showToast(`Excel exported — ${rows.length} record(s)`);
    } catch (e) {
      showToast('Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  const statsRecords = useMemo(() => {
    let list = allRecords;
    if (applied.className) list = list.filter(r => getDisplayClassName(r) === applied.className);
    if (applied.section) {
      const q = applied.section.trim().toLowerCase();
      list = list.filter(r => (r.section || '').toLowerCase().includes(q));
    }
    return list;
  }, [allRecords, applied.className, applied.section]);

  const present = statsRecords.filter(r => r.status === 'Present').length;
  const late = statsRecords.filter(r => r.status === 'Late').length;
  const markedAbsent = statsRecords.filter(r => r.status === 'Absent').length;
  const leaveCount = statsRecords.filter(r => r.status === 'Leave').length;
  const markedTotal = present + late + markedAbsent + leaveCount;
  const totalSt = totalStudents;
  const unmarked = Math.max(0, totalSt - markedTotal);
  const absent = markedAbsent + unmarked; // no record = didn't attend = absent
  const rate = totalSt > 0 ? Math.round((present / totalSt) * 100) : 0;

  // ── Mark-tab derived stats ──────────────────────────────────────────────────
  const markMarkedCount = Object.keys(markAttendanceMap).length;
  const markPresentCount = Object.values(markAttendanceMap).filter(a => a.status === 'Present').length;
  const markUnmarkedCount = Math.max(0, filteredMarkStudents.length - markMarkedCount);

  // ─── Render ───────────────────────────────────────────────────────────────

  // Full-page student detail — replaces the whole body area (not an overlay
  // popup), so it reads like a real page instead of a modal.
  if (viewOpen && viewRec) {
    return (
      <div className="adm-root">
        <style dangerouslySetInnerHTML={{ __html: S }} />
        <div className="adm-body" style={{ paddingTop: 24 }}>
          <StudentDetailPage
            rec={viewRec}
            history={studentHistory}
            historyVisible={historyVisible}
            historyLoading={historyLoading}
            onViewMore={loadMoreHistory}
            onBack={closeView}
            onEdit={(rec) => { closeView(); openEdit(rec); }}
            sessionMap={checkoutSessions}
          />
        </div>

        {/* Edit modal must still be reachable from the detail page */}
        {modalOpen && (
          <div className="modal-bg" onClick={e => e.target === e.currentTarget && closeModal()}>
            <div className="modal-box lg">
              <div className="modal-head">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Edit size={17} />
                    </div>
                    <div>
                      <div className="modal-title">Edit Attendance Record</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 3, fontWeight: 500 }}>
                        {editRec ? `${editRec.studentName} · ${getAdmissionNo(editRec) || '—'}` : ''}
                      </div>
                    </div>
                  </div>
                  <button onClick={closeModal} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="modal-body modal-body-scroll">
                <div className="status-seg">
                  {[
                    { v: 'Present', icon: CheckCircle2, cls: 'sel-present' },
                    { v: 'Absent', icon: XCircle, cls: 'sel-absent' },
                    { v: 'Late', icon: Clock, cls: 'sel-late' },
                    { v: 'Leave', icon: Calendar, cls: 'sel-leave' },
                  ].map(opt => (
                    <button type="button" key={opt.v} className={`status-seg-btn ${formData.status === opt.v ? opt.cls : ''}`} onClick={() => setFormData(f => ({ ...f, status: opt.v }))}>
                      <opt.icon size={16} />{opt.v}
                    </button>
                  ))}
                </div>
                <div className="two-col">
                  <div className="field-block">
                    <label className="adm-label">Attendance Date</label>
                    <input type="date" className="adm-input" value={formData.attendanceDate} onChange={e => setFormData(f => ({ ...f, attendanceDate: e.target.value }))} />
                  </div>
                  <SelectWrap label="Session" value={formData.sessionLabel} onChange={e => setFormData(f => ({ ...f, sessionLabel: e.target.value }))}>
                    <option value="FULL_DAY">Full Day</option><option value="MORNING">Morning</option><option value="AFTERNOON">Afternoon</option><option value="EVENING">Evening</option>
                  </SelectWrap>
                </div>
                <div className="two-col">
                  <div className="field-block">
                    <label className="adm-label">Check-In Time</label>
                    <div className="time-input-wrap">
                      <LogIn size={14} className="time-ic" />
                      <input type="time" className="adm-input" value={formData.checkInTime} onChange={e => setFormData(f => ({ ...f, checkInTime: e.target.value }))} />
                      {formData.checkInTime && <button type="button" className="time-clear" onClick={() => setFormData(f => ({ ...f, checkInTime: '' }))}><X size={13} /></button>}
                    </div>
                  </div>
                  <div className="field-block">
                    <label className="adm-label">Check-Out Time</label>
                    <div className="time-input-wrap">
                      <LogOut size={14} className="time-ic" />
                      <input type="time" className="adm-input" value={formData.checkOutTime} onChange={e => setFormData(f => ({ ...f, checkOutTime: e.target.value }))} />
                      {formData.checkOutTime && <button type="button" className="time-clear" onClick={() => setFormData(f => ({ ...f, checkOutTime: '' }))}><X size={13} /></button>}
                    </div>
                    {formErrors.checkOutTime && <div className="field-error"><AlertCircle size={11} /> {formErrors.checkOutTime}</div>}
                  </div>
                </div>
                <div className="field-block">
                  <label className="adm-label">Remarks</label>
                  <textarea className="modal-textarea" rows={3} maxLength={500} value={formData.remarks} onChange={e => setFormData(f => ({ ...f, remarks: e.target.value }))} />
                </div>
                {editRec && (
                  <div className="field-block">
                    <label className="adm-label">Reason for Edit (optional)</label>
                    <textarea className="modal-textarea" rows={2} maxLength={500}
                      placeholder="e.g. Corrected check-out time — student left early for a doctor's appointment"
                      value={formData.note} onChange={e => setFormData(f => ({ ...f, note: e.target.value }))} />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={closeModal} style={{ flex: 1 }}>Cancel</button>
                <button className="btn btn-emerald" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
                  {saving ? <><Loader2 size={15} className="spin" /> Saving…</> : <><Check size={15} /> Update Attendance</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div key={toast.id} className="toast-box" style={{
            background: toast.type === 'success' ? 'linear-gradient(135deg,#059669,#10b981)' : toast.type === 'error' ? 'linear-gradient(135deg,#dc2626,#ef4444)' : 'linear-gradient(135deg,#d97706,#f59e0b)',
            color: '#fff'
          }}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : toast.type === 'error' ? <XCircle size={18} /> : <AlertTriangle size={18} />}
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7, display: 'flex', padding: 0 }}><X size={15} /></button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="adm-root">
      <style dangerouslySetInnerHTML={{ __html: S }} />

      {/* ── Header ── */}
      <div className="adm-header">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(16,185,129,0.25)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={20} color="#10b981" />
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                  Attendance Dashboard
                </h1>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                Manage &amp; monitor student attendance records
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" onClick={() => { fetchRecords(); fetchTotalStudents(); }} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10 }}>
                <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
              </button>
            </div>
          </div>

          {/* Stat pills */}
          <div className="adm-header-grid">
            <div className="stat-pill">
              <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.2)' }}><Users size={20} color="#818cf8" /></div>
              <div style={{ flex: 1 }}>
                <div className="stat-lbl">Total Students</div>
                <div className="stat-val">{totalStuLoading ? '…' : totalSt}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 500 }}>active</div>
              </div>
            </div>
            <div className="stat-pill">
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.2)' }}><UserCheck size={20} color="#10b981" /></div>
              <div style={{ flex: 1 }}>
                <div className="stat-lbl">Present</div>
                <div className="stat-val">{present}</div>
                <div className="stat-bar-wrap"><div className="stat-bar" style={{ width: totalSt ? `${(present / totalSt) * 100}%` : '0%', background: '#10b981' }} /></div>
              </div>
            </div>
            <div className="stat-pill">
              <div className="stat-icon" style={{ background: 'rgba(217,119,6,0.2)' }}><Clock size={20} color="#f59e0b" /></div>
              <div style={{ flex: 1 }}>
                <div className="stat-lbl">Late</div>
                <div className="stat-val">{late}</div>
                <div className="stat-bar-wrap"><div className="stat-bar" style={{ width: totalSt ? `${(late / totalSt) * 100}%` : '0%', background: '#f59e0b' }} /></div>
              </div>
            </div>
            <div className="stat-pill">
              <div className="stat-icon" style={{ background: 'rgba(225,29,72,0.2)' }}><UserX size={20} color="#E2B94D" /></div>
              <div style={{ flex: 1 }}>
                <div className="stat-lbl">Absent</div>
                <div className="stat-val">{absent}</div>
                <div className="stat-bar-wrap"><div className="stat-bar" style={{ width: totalSt ? `${(absent / totalSt) * 100}%` : '0%', background: '#E2B94D' }} /></div>
              </div>
            </div>
            <div className="stat-pill">
              <RateRing pct={rate} />
              <div style={{ flex: 1 }}>
                <div className="stat-lbl">Attendance Rate</div>
                <div className="stat-val">{rate}%</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 500 }}>of {totalSt} students</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="adm-body">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { id: 'history', label: 'History & Reports', icon: History },
            { id: 'mark', label: 'Mark Attendance', icon: QrCode },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="btn btn-outline btn-sm"
              style={{ background: activeTab === tab.id ? '#0f3460' : '#fff', color: activeTab === tab.id ? '#fff' : '#475569', borderColor: activeTab === tab.id ? '#0f3460' : '#e2e8f0' }}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'mark' ? (
          <>
            {/* ── Toolbar: search + class/section/date/session filters ── */}
            <div className="mk-toolbar anim-up">
              <div className="mk-toolbar-top">
                <div className="mk-search-wrap">
                  <Search size={15} />
                  <input placeholder="Search a student by name or admission no…" value={markSearch} onChange={e => setMarkSearch(e.target.value)} />
                </div>
                <div className="mk-chip-row">
                  <input type="date" className="mk-chip-select" value={markDate} onChange={e => setMarkDate(e.target.value)} />
                  <select className="mk-chip-select" value={markSession} onChange={e => setMarkSession(e.target.value)}>
                    <option value="FULL_DAY">Full Day</option>
                    <option value="MORNING">Morning</option>
                    <option value="AFTERNOON">Afternoon</option>
                    <option value="EVENING">Evening</option>
                  </select>
                  <select className="mk-chip-select" value={markClass} onChange={e => setMarkClass(e.target.value)}>
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                  <input className="mk-chip-select" style={{ width: 70 }} placeholder="Sec." value={markSection} onChange={e => setMarkSection(e.target.value)} />
                  <button className="btn btn-outline btn-sm" onClick={() => { setMarkDate(today()); setMarkSession('FULL_DAY'); setMarkClass(''); setMarkSection(''); setMarkSearch(''); }}>
                    <RefreshCw size={13} />
                  </button>
                </div>
              </div>

              <div className="mk-stats-strip">
                <div className="mk-stat-chip" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                  <Users size={16} color="#0C2A47" />
                  <div><div className="n" style={{ color: '#0C2A47' }}>{filteredMarkStudents.length}</div><div className="l" style={{ color: '#0C2A47' }}>Students</div></div>
                </div>
                <div className="mk-stat-chip" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
                  <CheckCircle2 size={16} color="#059669" />
                  <div><div className="n" style={{ color: '#059669' }}>{markPresentCount}</div><div className="l" style={{ color: '#059669' }}>Present</div></div>
                </div>
                <div className="mk-stat-chip" style={{ background: '#fff7ed', borderColor: '#fed7aa' }}>
                  <AlertCircle size={16} color="#ea580c" />
                  <div><div className="n" style={{ color: '#ea580c' }}>{markUnmarkedCount}</div><div className="l" style={{ color: '#ea580c' }}>Unmarked</div></div>
                </div>
                <div className="mk-stat-chip" style={{ background: '#f5f3ff', borderColor: '#ddd6fe' }}>
                  <MapPin size={16} color="#7c3aed" />
                  <div><div className="n" style={{ color: '#7c3aed' }}>{checkedInStudents.length}</div><div className="l" style={{ color: '#7c3aed' }}>Checked In</div></div>
                </div>
              </div>

              {bulkSelected.length > 0 && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#f7f9ff', border: '1px solid #e0e7ff', borderRadius: 12, padding: '8px 12px' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f3460' }}>{bulkSelected.length} selected</span>
                  <button className="btn btn-emerald btn-sm" onClick={() => markBulk('Present')} disabled={markSaving} style={{ marginLeft: 'auto' }}>Mark Present</button>
                  <button className="btn btn-outline btn-sm" onClick={() => markBulk('Absent')} disabled={markSaving}>Mark Absent</button>
                  <button className="btn-icon" onClick={() => setBulkSelected([])} title="Clear selection"><X size={14} /></button>
                </div>
              )}
            </div>

            <div className="mk-layout anim-up" style={{ animationDelay: '0.06s' }}>
              {/* ── Student roster ── */}
              <div>
                {markLoading ? (
                  <div className="table-card"><Spinner /></div>
                ) : filteredMarkStudents.length === 0 ? (
                  <div className="table-card empty-state">
                    <div className="empty-icon"><Users size={32} color="#94a3b8" /></div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#64748b' }}>No students to show</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Try a different class, section, or search term</p>
                  </div>
                ) : (
                  <div className="student-grid">
                    {filteredMarkStudents.map(student => {
                      const sid = getId(student._id || student.id);
                      const currentStatus = markAttendanceMap[sid]?.status;
                      const isSelected = bulkSelected.includes(sid);
                      const isCheckedIn = checkedInStudents.includes(sid);
                      return (
                        <div key={sid} className={`student-card ${isSelected ? 'sel' : ''}`}>
                          <div className="student-card-top">
                            <div className={`student-card-check ${isSelected ? 'on' : ''}`}
                              onClick={() => setBulkSelected(prev => prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid])}>
                              {isSelected && <Check size={13} />}
                            </div>
                            <div className="avatar" style={{ width: 38, height: 38, fontSize: 14 }}>
                              {getStudentDisplayName(student).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="student-card-name">{getStudentDisplayName(student)}</div>
                              <div className="student-card-sub">{student.admissionNo || student.enrollmentId || '—'} {student.className ? `· ${student.className}` : ''}</div>
                            </div>
                            {currentStatus ? (
                              <span className={`badge ${statusClass(currentStatus)}`} style={{ flexShrink: 0 }}>{currentStatus}</span>
                            ) : (
                              <span className="badge b-default" style={{ flexShrink: 0 }}>Unmarked</span>
                            )}
                          </div>

                          <div className="student-card-actions">
                            <button className={`mini-act-btn present ${currentStatus === 'Present' ? 'on' : ''}`} onClick={() => handleMarkStudent(student, 'Present')} disabled={markSaving}>
                              <CheckCircle2 size={14} />Present
                            </button>
                            <button className={`mini-act-btn absent ${currentStatus === 'Absent' ? 'on' : ''}`} onClick={() => handleMarkStudent(student, 'Absent')} disabled={markSaving}>
                              <XCircle size={14} />Absent
                            </button>
                            <button className={`mini-act-btn late ${currentStatus === 'Late' ? 'on' : ''}`} onClick={() => handleMarkStudent(student, 'Late')} disabled={markSaving}>
                              <Clock size={14} />Late
                            </button>
                            <button className={`mini-act-btn leave ${currentStatus === 'Leave' ? 'on' : ''}`} onClick={() => handleMarkStudent(student, 'Leave')} disabled={markSaving}>
                              <Calendar size={14} />Leave
                            </button>
                          </div>

                          {isCheckedIn ? (
                            <button className="mk-checkinout-btn out" onClick={() => handleCheckOut(student)} disabled={markSaving}>
                              <LogOut size={14} /> Check-Out from Center
                            </button>
                          ) : (
                            <button className="mk-checkinout-btn in" onClick={() => handleCheckIn(student)} disabled={markSaving}>
                              <LogIn size={14} /> Check-In to Center
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Side rail: QR scanner + recent actions ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="mk-scanner-card">
                  <div className="mk-scanner-head">
                    <span className="t"><ScanLine size={16} /> QR Scanner</span>
                    <button className="btn-icon" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
                      onClick={() => setScannerOpen(o => !o)} title={scannerOpen ? 'Collapse' : 'Expand'}>
                      {scannerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                  {scannerOpen && (
                    <>
                      {cameraError && (
                        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 10, fontSize: 12, fontWeight: 600, marginBottom: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                          <AlertCircle size={14} /> {cameraError}
                        </div>
                      )}
                      <div id="admin-qr-reader" className={isScanning ? '' : 'hidden'} style={{ minHeight: isScanning ? 220 : 0, borderRadius: 16, overflow: 'hidden' }} />
                      {!isScanning ? (
                        <div className="mk-scan-frame">
                          <QrCode size={30} color="rgba(255,255,255,0.6)" />
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textAlign: 'center', padding: '0 10px' }}>Point the camera at a student's QR code</p>
                          <button className="btn btn-emerald btn-sm" onClick={startCamera}>Start Camera</button>
                        </div>
                      ) : (
                        <button className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 10 }} onClick={() => stopCamera()}>Stop Camera</button>
                      )}
                    </>
                  )}
                </div>

                <div className="mk-recent-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0f3460', display: 'flex', alignItems: 'center', gap: 7 }}><Zap size={14} color="#f59e0b" /> Recent Actions</span>
                    <span className="badge b-system">Live</span>
                  </div>
                  {recentActions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8' }}>
                      <CheckCircle2 size={22} />
                      <p style={{ fontSize: 12, fontWeight: 600, marginTop: 8 }}>No recent actions yet</p>
                    </div>
                  ) : recentActions.map(action => (
                    <div key={action.id} className="mk-recent-item" style={{ background: action.type === 'success' ? '#ecfdf5' : '#fff1f2', color: action.type === 'success' ? '#059669' : '#E2B94D' }}>
                      {action.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      <span style={{ flex: 1 }}>{action.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>

            {/* ── Filter Panel ── */}
            <div className="filter-panel anim-up">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <SlidersHorizontal size={15} color="#0f3460" />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0f3460' }}>Filters</span>
                {[applied.status, applied.className, applied.section, applied.sessionLabel, applied.sessionId, applied.search].filter(Boolean).length > 0 && (
                  <span style={{ background: '#0f3460', color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 800, padding: '2px 8px', marginLeft: 4 }}>
                    {[applied.status, applied.className, applied.section, applied.sessionLabel, applied.sessionId, applied.search].filter(Boolean).length} active
                  </span>
                )}
              </div>

              <div className="filter-row">
                <div>
                  <label className="adm-label">From Date</label>
                  <input type="date" className="adm-input" value={filters.dateFrom}
                    onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
                </div>
                <div>
                  <label className="adm-label">To Date</label>
                  <input type="date" className="adm-input" value={filters.dateTo}
                    onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
                </div>
                <SelectWrap label="Status" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                  <option value="">All Status</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                  <option value="Leave">Leave</option>
                </SelectWrap>
                <SelectWrap label="Class" value={filters.className} onChange={e => setFilters(f => ({ ...f, className: e.target.value }))}>
                  <option value="">All Classes</option>
                  {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </SelectWrap>
                <SelectWrap label="Academic Session" value={filters.sessionId} onChange={e => setFilters(f => ({ ...f, sessionId: e.target.value }))}>
                  <option value="">All Sessions</option>
                  {academicSessions.map(s => (
                    <option key={s._id} value={s._id}>{s.name}{s.status === 'Active' ? ' (Active)' : ''}</option>
                  ))}
                </SelectWrap>
                <div>
                  <label className="adm-label">Section</label>
                  <input type="text" className="adm-input" placeholder="e.g. A" value={filters.section} list="section-options"
                    onChange={e => setFilters(f => ({ ...f, section: e.target.value }))} />
                  <datalist id="section-options">
                    {sectionOptions.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
                <div>
                  <label className="adm-label">Search Student</label>
                  <input type="text" className="adm-input" placeholder="Name or Adm. No" value={filters.search}
                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && applyFilters()} />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={applyFilters} style={{ flex: 1, minWidth: 100 }}>
                    <Filter size={14} /> Apply
                  </button>
                  <button className="btn btn-outline" onClick={resetFilters} style={{ flex: 1, minWidth: 90 }}>
                    <X size={14} /> Reset
                  </button>
                </div>
              </div>
            </div>

            {/* ── Table Card ── */}
            <div className="table-card anim-up" style={{ animationDelay: '0.08s' }}>
              <div className="table-header">
                <div>
                  <div className="table-title">Attendance Records</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>
                    {fmtDate(applied.dateFrom)} – {fmtDate(applied.dateTo)} · {total} record{total !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div className="view-toggle">
                    <button className={historyView === 'table' ? 'active' : ''} onClick={() => setHistoryView('table')} title="Table view">
                      <List size={15} />
                    </button>
                    <button className={historyView === 'grid' ? 'active' : ''} onClick={() => setHistoryView('grid')} title="Grid view">
                      <LayoutGrid size={15} />
                    </button>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={openAddNew}>
                    <UserPlus size={14} /> Add Record
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={exportExcel} disabled={exporting}>
                    {exporting ? <Loader2 size={14} className="spin" /> : <FileSpreadsheet size={14} />} Export Excel
                  </button>
                </div>
              </div>

              {loading ? <Spinner /> : pageRecords.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Users size={32} color="#94a3b8" />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>No records found</p>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>Try adjusting your filters or date range</p>
                </div>
              ) : historyView === 'grid' ? (
                <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {pageRecords.map((rec, i) => (
                    <HistoryCard key={rec._id || i} rec={rec} onEdit={openEdit} onView={openView} sessionMap={checkoutSessions} />
                  ))}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="att-tbl">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Class</th>
                        <th>Date</th>
                        <th>Session</th>
                        <th>Status</th>
                        <th>Punctuality</th>
                        <th className="hide-mobile">Method</th>
                        <th className="hide-mobile">Marked By</th>
                        <th className="hide-mobile">Check-In</th>
                        <th className="hide-mobile">Check-Out</th>
                        <th className="hide-mobile">Remarks</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRecords.map((rec, i) => {
                        const punct = computeArrivalPunctuality(rec);
                        const recCheckOut = getRecordCheckOut(rec, checkoutSessions);
                        return (
                          <tr key={rec._id || i}>
                            <td>
                              <AvatarCell name={rec.studentName} adm={getAdmissionNo(rec)} />
                            </td>
                            <td>
                              <span style={{ fontWeight: 700, color: '#16213e' }}>{getDisplayClassName(rec)}</span>
                              {rec.section && <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>·{rec.section}</span>}
                            </td>
                            <td>
                              <span className="mono" style={{ fontSize: 12, color: '#475569' }}>{rec.attendanceDateKey || fmtDate(rec.attendanceDate)}</span>
                            </td>
                            <td style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>
                              {(rec.sessionLabel || 'Full Day').replace('_', ' ')}
                            </td>
                            <td>
                              <span className={`badge ${statusClass(rec.status)}`}>
                                <StatusDot s={rec.status} /> {rec.status}
                              </span>
                            </td>
                            <td>
                              {punct.type !== 'unknown' ? <PunctualityBadge punct={punct} /> : <span style={{ fontSize: 12, color: '#cbd5e1' }}>—</span>}
                            </td>
                            <td className="hide-mobile">
                              <span className={`badge ${methodClass(rec.method)}`} style={{ textTransform: 'capitalize' }}>
                                {rec.method || '—'}
                              </span>
                            </td>
                            <td className="hide-mobile" style={{ fontSize: 12, color: '#64748b' }}>
                              {rec.markedBy?.name || rec.markedBy || '—'}
                            </td>
                            <td className="hide-mobile">
                              <span className="mono" style={{ fontSize: 11, color: '#64748b' }}>{fmtTime(rec.checkInTime || rec.markedAt)}</span>
                            </td>
                            <td className="hide-mobile">
                              <span className="mono" style={{ fontSize: 11, color: recCheckOut ? '#64748b' : '#cbd5e1' }}>{recCheckOut ? fmtTime(recCheckOut) : '—'}</span>
                            </td>
                            <td className="hide-mobile" style={{ fontSize: 12, color: '#94a3b8', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {rec.remarks || <span style={{ opacity: 0.4 }}>—</span>}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: 6 }}>
                                <button className="btn-icon view" onClick={() => openView(rec)} title="View Full Details">
                                  <Eye size={14} />
                                </button>
                                <button className="btn-icon" onClick={() => openEdit(rec)} title="Edit">
                                  <Edit size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {total > applied.limit && (
                <div className="pagination">
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                    Showing {((applied.page - 1) * applied.limit) + 1}–{Math.min(applied.page * applied.limit, total)} of {total}
                  </span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button className="page-btn" disabled={applied.page === 1}
                      onClick={() => setApplied(a => ({ ...a, page: a.page - 1 }))}>
                      <ChevronLeft size={15} />
                    </button>
                    <div className="page-current">{applied.page} / {totalPages}</div>
                    <button className="page-btn" disabled={applied.page >= totalPages}
                      onClick={() => setApplied(a => ({ ...a, page: a.page + 1 }))}>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Add/Edit Modal (list page context) ── */}
        {modalOpen && (
          <div className="modal-bg" onClick={e => e.target === e.currentTarget && closeModal()}>
            <div className="modal-box lg">
              <div className="modal-head">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {editRec ? <Edit size={17} /> : <UserPlus size={17} />}
                    </div>
                    <div>
                      <div className="modal-title">{editRec ? 'Edit Attendance Record' : 'Add Manual Attendance'}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 3, fontWeight: 500 }}>
                        {editRec ? `${editRec.studentName} · ${getAdmissionNo(editRec) || '—'}` : 'Creates a new record via the manual attendance API'}
                      </div>
                    </div>
                  </div>
                  <button onClick={closeModal} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="modal-body modal-body-scroll">

                {/* ── Student selection (add mode only) ── */}
                {!editRec ? (
                  <div className="field-block">
                    <label className="adm-label">Student</label>
                    {formData.studentId ? (
                      <div className="selected-student-chip">
                        <div className="avatar">{(formData.studentDisplay || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 13, color: '#16213e' }}>{formData.studentDisplay}</div>
                          <div className="mono" style={{ fontSize: 11, color: '#0C2A47' }}>{formData.studentAdm || '—'}</div>
                        </div>
                        <button type="button" className="chip-clear" onClick={clearSelectedStudent} title="Change student">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="student-picker">
                        <div className="student-picker-input-wrap">
                          <Search size={14} className="picker-search-ic" />
                          <input
                            className="adm-input"
                            placeholder="Search by name or admission no…"
                            value={formData.studentDisplay}
                            onChange={e => { setFormData(f => ({ ...f, studentDisplay: e.target.value })); setStudentPickerOpen(true); }}
                            onFocus={() => setStudentPickerOpen(true)}
                            onBlur={() => setTimeout(() => setStudentPickerOpen(false), 120)}
                          />
                        </div>
                        {studentPickerOpen && (
                          <div className="student-suggest">
                            {modalStudentListLoading ? (
                              <div className="student-suggest-empty"><Loader2 size={14} className="spin" /> Loading students…</div>
                            ) : modalStudentMatches.length === 0 ? (
                              <div className="student-suggest-empty">No matching students found</div>
                            ) : modalStudentMatches.map(s => {
                              const sid = getId(s._id || s.id);
                              return (
                                <div className="student-suggest-item" key={sid} onMouseDown={() => selectStudentForModal(s)}>
                                  <div className="avatar" style={{ width: 30, height: 30, fontSize: 11, borderRadius: 8 }}>
                                    {getStudentDisplayName(s).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: 12.5, color: '#16213e' }}>{getStudentDisplayName(s)}</div>
                                    <div className="mono" style={{ fontSize: 10.5, color: '#94a3b8' }}>{s.admissionNo || s.enrollmentId || '—'} {s.className ? `· ${s.className}` : ''}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    {formErrors.studentId && <div className="field-error"><AlertCircle size={11} /> {formErrors.studentId}</div>}
                  </div>
                ) : (
                  <div className="selected-student-chip">
                    <div className="avatar">{(editRec.studentName || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: '#16213e' }}>{editRec.studentName}</div>
                      <div className="mono" style={{ fontSize: 11, color: '#0C2A47' }}>{getAdmissionNo(editRec) || '—'} · {getDisplayClassName(editRec)}</div>
                    </div>
                  </div>
                )}

                {/* ── Status ── */}
                <div className="field-block">
                  <label className="adm-label">Status</label>
                  <div className="status-seg">
                    {[
                      { v: 'Present', icon: CheckCircle2, cls: 'sel-present' },
                      { v: 'Absent', icon: XCircle, cls: 'sel-absent' },
                      { v: 'Late', icon: Clock, cls: 'sel-late' },
                      { v: 'Leave', icon: Calendar, cls: 'sel-leave' },
                    ].map(opt => (
                      <button
                        type="button"
                        key={opt.v}
                        className={`status-seg-btn ${formData.status === opt.v ? opt.cls : ''}`}
                        onClick={() => setFormData(f => ({ ...f, status: opt.v }))}
                      >
                        <opt.icon size={16} />
                        {opt.v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="section-divider"><span>Schedule</span></div>

                {/* ── Date + Session ── */}
                <div className="two-col">
                  <div className="field-block">
                    <label className="adm-label">Attendance Date</label>
                    <input type="date" className="adm-input" value={formData.attendanceDate}
                      onChange={e => setFormData(f => ({ ...f, attendanceDate: e.target.value }))} />
                    {formErrors.attendanceDate && <div className="field-error"><AlertCircle size={11} /> {formErrors.attendanceDate}</div>}
                  </div>
                  <SelectWrap label="Session" value={formData.sessionLabel} onChange={e => setFormData(f => ({ ...f, sessionLabel: e.target.value }))}>
                    <option value="FULL_DAY">Full Day</option>
                    <option value="MORNING">Morning</option>
                    <option value="AFTERNOON">Afternoon</option>
                    <option value="EVENING">Evening</option>
                  </SelectWrap>
                </div>

                {/* ── Check-in / Check-out time ── */}
                <div className="two-col">
                  <div className="field-block">
                    <label className="adm-label">Check-In Time</label>
                    <div className="time-input-wrap">
                      <LogIn size={14} className="time-ic" />
                      <input type="time" className="adm-input" value={formData.checkInTime}
                        onChange={e => setFormData(f => ({ ...f, checkInTime: e.target.value }))} />
                      {formData.checkInTime && (
                        <button type="button" className="time-clear" onClick={() => setFormData(f => ({ ...f, checkInTime: '' }))} title="Clear">
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="field-block">
                    <label className="adm-label">Check-Out Time</label>
                    <div className="time-input-wrap">
                      <LogOut size={14} className="time-ic" />
                      <input type="time" className="adm-input" value={formData.checkOutTime}
                        onChange={e => setFormData(f => ({ ...f, checkOutTime: e.target.value }))} />
                      {formData.checkOutTime && (
                        <button type="button" className="time-clear" onClick={() => setFormData(f => ({ ...f, checkOutTime: '' }))} title="Clear">
                          <X size={13} />
                        </button>
                      )}
                    </div>
                    {formErrors.checkOutTime && <div className="field-error"><AlertCircle size={11} /> {formErrors.checkOutTime}</div>}
                  </div>
                </div>
                <div className="field-hint">
                  <Timer size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1.5px' }} />
                  Both times are optional — leave blank if not applicable. Times are saved for {formData.attendanceDate ? fmtDate(formData.attendanceDate) : 'the selected date'} in your local timezone.
                </div>

                <div className="section-divider"><span>Notes</span></div>

                <div className="field-block">
                  <label className="adm-label">Remarks (optional)</label>
                  <textarea className="modal-textarea" rows={3} maxLength={500}
                    placeholder="Add any notes or reason…"
                    value={formData.remarks} onChange={e => setFormData(f => ({ ...f, remarks: e.target.value }))} />
                </div>

                {editRec && (
                  <div className="field-block">
                    <label className="adm-label">Reason for Edit (optional)</label>
                    <textarea className="modal-textarea" rows={2} maxLength={500}
                      placeholder="e.g. Corrected check-out time — student left early for a doctor's appointment"
                      value={formData.note} onChange={e => setFormData(f => ({ ...f, note: e.target.value }))} />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline" onClick={closeModal} style={{ flex: 1 }}>Cancel</button>
                <button className="btn btn-emerald" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
                  {saving ? <><Loader2 size={15} className="spin" /> Saving…</> : <><Check size={15} /> {editRec ? 'Update' : 'Save'} Attendance</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div key={toast.id} className="toast-box" style={{
            background: toast.type === 'success' ? 'linear-gradient(135deg,#059669,#10b981)' :
              toast.type === 'error' ? 'linear-gradient(135deg,#dc2626,#ef4444)' :
                'linear-gradient(135deg,#d97706,#f59e0b)',
            color: '#fff'
          }}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : toast.type === 'error' ? <XCircle size={18} /> : <AlertTriangle size={18} />}
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7, display: 'flex', padding: 0 }}>
              <X size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAttendancePage;