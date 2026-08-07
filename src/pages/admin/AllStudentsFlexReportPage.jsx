import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Download, Filter, Loader2, Eye, AlertCircle, TrendingDown, TrendingUp,
  Clock, Hourglass, AlertTriangle, ChevronUp, ChevronDown, Zap
} from 'lucide-react';
import { getStudentsAPI } from '../../api/students';
import { getClassesAPI } from '../../api/classes';
import { calculateFlexHoursSummary, generateFlexReportExcelData } from '../../api/flexReport.api';

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type = 'error', onClose }) => {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  const styles = {
    error: { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' },
    success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
    info: { bg: '#EFF6FF', border: '#BFDBFE', text: '#0C2A47' },
  }[type] || {};
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
      background: styles.bg, border: `1.5px solid ${styles.border}`,
      borderRadius: 12, padding: '11px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      maxWidth: 340
    }}>
      <AlertCircle size={16} color={styles.text} />
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: styles.text, flex: 1 }}>{message}</p>
      <button onClick={onClose} style={{
        width: 24, height: 24, borderRadius: 6, border: 'none',
        background: 'rgba(0,0,0,0.06)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>✕</button>
    </div>
  );
};

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  blue: { bg: '#EFF6FF', text: '#0C2A47', border: '#BFDBFE', solid: '#0C2A47' },
  green: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', solid: '#16A34A' },
  red: { bg: '#FFF1F2', text: '#E2B94D', border: '#FECDD3', solid: '#E2B94D' },
  amber: { bg: '#FFFBEB', text: '#B45309', border: '#FCD34D', solid: '#D97706' },
  orange: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', solid: '#EA580C' },
  slate: { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0', solid: '#64748B' },
  teal: { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4', solid: '#0D9488' },
};

const fmt2 = (n) => (Number(n) || 0).toFixed(2);

// ─── Main Component ───────────────────────────────────────────────────────────
const AllStudentsFlexReportPage = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [classesData, setClassesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [hoursFilter, setHoursFilter] = useState('all'); // all, low, zero, overstay
  const [sortBy, setSortBy] = useState('remaining'); // remaining, paid, consumed
  const [sortDir, setSortDir] = useState('asc');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch classes
        const classRes = await getClassesAPI({ limit: 100 });
        const classes = Array.isArray(classRes) ? classRes : (classRes.data || []);
        setClassesData(classes);

        // Fetch students
        // NOTE: getStudentsAPI returns the RAW axios response (not response.data),
        // so the backend envelope is at studentsRes.data, and the actual array
        // is at studentsRes.data.data. Unwrapping only one level here used to
        // leave `studentsList` as a non-array object, which crashed downstream
        // filtering/mapping and made this page silently show nothing.
        const studentsRes = await getStudentsAPI({
          status: statusFilter,
          limit: 1000,
        });
        const envelope = studentsRes?.data || {};
        const studentsList = Array.isArray(envelope) ? envelope : (Array.isArray(envelope.data) ? envelope.data : []);
        setStudents(studentsList);
      } catch (error) {
        console.error('Error fetching data:', error);
        setToast({ message: 'Error loading data', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [statusFilter]);

  // Process and filter
  const processed = students
    .map(s => ({
      _id: s._id,
      name: s.fullName || `${s.firstName} ${s.lastName}`.trim(),
      enrollmentId: s.admissionNo,
      status: s.status,
      classIds: s.classIds || [],
      classTimings: s.classTimings || {},
      consumedFlexiHours: s.consumedFlexiHours || 0,
    }))
    .map(s => ({
      ...s,
      summary: calculateFlexHoursSummary(s, classesData),
    }))
    .filter(item => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        if (
          !item.name.toLowerCase().includes(q) &&
          !item.enrollmentId.toLowerCase().includes(q)
        ) return false;
      }

      // Hours filter
      const { summary } = item;
      if (hoursFilter === 'low' && !summary.isLow) return false;
      if (hoursFilter === 'zero' && summary.totalLeft !== 0) return false;
      if (hoursFilter === 'overstay' && !summary.hasOverstay) return false;

      return true;
    })
    .sort((a, b) => {
      let aVal, bVal;

      if (sortBy === 'remaining') {
        aVal = a.summary.totalLeft;
        bVal = b.summary.totalLeft;
      } else if (sortBy === 'paid') {
        aVal = a.summary.totalPaid;
        bVal = b.summary.totalPaid;
      } else if (sortBy === 'consumed') {
        aVal = a.summary.totalConsumed;
        bVal = b.summary.totalConsumed;
      } else if (sortBy === 'name') {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      }

      if (sortDir === 'asc') return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    });

  // Download excel
  const downloadExcel = () => {
    try {
      const { headers, rows } = generateFlexReportExcelData(processed, classesData);
      
      // Filtered headers and rows based on current filters
      const filteredData = {
        headers: ['Student Name', 'Enrollment ID', 'Status', 'Total Paid', 'Total Free', 'Total Consumed', 'Remaining', 'Extra Stay'],
        rows: processed.map(item => [
          item.name,
          item.enrollmentId,
          item.status,
          item.summary.totalPaid.toFixed(2),
          item.summary.totalFree.toFixed(2),
          item.summary.totalConsumed.toFixed(2),
          item.summary.totalLeft.toFixed(2),
          item.summary.overstayHours.toFixed(2),
        ]),
      };

      const csv = [
        filteredData.headers.join(','),
        ...filteredData.rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AllStudents_FlexReport_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      setToast({ message: 'Report downloaded successfully', type: 'success' });
    } catch (error) {
      setToast({ message: 'Error downloading report', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px', color: '#0C2A47' }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: '#64748B' }}>Loading flex reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '16px' }}>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />

      {/* Header */}
      <div style={{ maxWidth: 1400, margin: '0 auto 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#030B15' }}>
              📊 All Students Flex Report
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              {processed.length} student{processed.length !== 1 ? 's' : ''} • {fmt2(processed.reduce((s, item) => s + item.summary.totalLeft, 0))} hrs remaining
            </p>
          </div>
          <button onClick={downloadExcel} style={{
            padding: '11px 16px', borderRadius: 10, border: 'none',
            background: '#059669', color: '#fff', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
            transition: 'all .15s'
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#047857'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <Download size={15} /> Download Report
          </button>
        </div>

        {/* Filters */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: '14px', border: '1px solid #E2E8F0',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12,
          marginBottom: 20
        }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', paddingLeft: 36, padding: '9px 12px', borderRadius: 8,
                border: '1.5px solid #E2E8F0', fontSize: 12, fontFamily: 'inherit',
                fontWeight: 600, color: '#030B15', boxSizing: 'border-box',
                outline: 'none', transition: 'border-color .15s'
              }}
              onFocus={e => { e.target.style.borderColor = '#0C2A47'; }}
              onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }}
            />
          </div>

          {/* Status Filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{
            padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0',
            fontSize: 12, fontWeight: 600, fontFamily: 'inherit', color: '#030B15',
            background: '#fff', cursor: 'pointer'
          }}>
            <option value="Active">Active Students</option>
            <option value="Inactive">Inactive Students</option>
            <option value="">All Status</option>
          </select>

          {/* Hours Filter */}
          <select value={hoursFilter} onChange={e => setHoursFilter(e.target.value)} style={{
            padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0',
            fontSize: 12, fontWeight: 600, fontFamily: 'inherit', color: '#030B15',
            background: '#fff', cursor: 'pointer'
          }}>
            <option value="all">All Students</option>
            <option value="low">⚠ Low Hours (&lt;6 hrs)</option>
            <option value="zero">0️⃣ No Hours Left</option>
            <option value="overstay">⏱️ Extra Stay Only</option>
          </select>

          {/* Sort */}
          <div style={{ display: 'flex', gap: 6 }}>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
              flex: 1, padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0',
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit', color: '#030B15',
              background: '#fff', cursor: 'pointer'
            }}>
              <option value="remaining">Sort: Remaining Hours</option>
              <option value="paid">Sort: Paid Hours</option>
              <option value="consumed">Sort: Consumed Hours</option>
              <option value="name">Sort: Name</option>
            </select>
            <button onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} style={{
              width: 38, height: 38, borderRadius: 8, border: '1.5px solid #E2E8F0',
              background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0C2A47', fontWeight: 700, transition: 'all .15s'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
              {sortDir === 'asc' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {processed.length > 0 ? (
          <div style={{
            background: '#fff', borderRadius: 12, overflow: 'hidden',
            border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '200px 140px 120px 100px 100px 100px 100px 100px 80px',
              gap: 12, padding: '12px', background: '#F8FAFC',
              borderBottom: '1.5px solid #E2E8F0', fontWeight: 700, fontSize: 11,
              color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              <div>Student</div>
              <div>Enrollment ID</div>
              <div>Status</div>
              <div>Paid Hrs</div>
              <div>Free Hrs</div>
              <div>Consumed</div>
              <div>Remaining</div>
              <div>Extra Stay</div>
              <div style={{ textAlign: 'center' }}>Action</div>
            </div>

            {/* Table Rows */}
            {processed.map((item) => (
              <div key={item._id} style={{
                display: 'grid',
                gridTemplateColumns: '200px 140px 120px 100px 100px 100px 100px 100px 80px',
                gap: 12, padding: '12px', borderBottom: '1px solid #E2E8F0',
                alignItems: 'center', hover: { background: '#F8FAFC' },
                transition: 'all .15s'
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
                {/* Student Name */}
                <div style={{ fontSize: 12, fontWeight: 700, color: '#030B15' }}>{item.name}</div>

                {/* Enrollment ID */}
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', fontFamily: 'monospace' }}>{item.enrollmentId}</div>

                {/* Status */}
                <div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6,
                    background: item.status === 'Active' ? '#F0FDF4' : '#F8FAFC',
                    color: item.status === 'Active' ? '#15803D' : '#475569'
                  }}>
                    {item.status}
                  </span>
                </div>

                {/* Paid Hours */}
                <div style={{
                  fontSize: 12, fontWeight: 800, color: T.amber.text,
                  background: T.amber.bg, padding: '6px 8px', borderRadius: 6, textAlign: 'center'
                }}>
                  {fmt2(item.summary.totalPaid)}
                </div>

                {/* Free Hours */}
                <div style={{
                  fontSize: 12, fontWeight: 800, color: T.green.text,
                  background: T.green.bg, padding: '6px 8px', borderRadius: 6, textAlign: 'center'
                }}>
                  {fmt2(item.summary.totalFree)}
                </div>

                {/* Consumed Hours */}
                <div style={{
                  fontSize: 12, fontWeight: 800, color: T.orange.text,
                  background: T.orange.bg, padding: '6px 8px', borderRadius: 6, textAlign: 'center'
                }}>
                  {fmt2(item.summary.totalConsumed)}
                </div>

                {/* Remaining Hours */}
                <div style={{
                  fontSize: 12, fontWeight: 800,
                  color: item.summary.isLow ? T.red.text : T.teal.text,
                  background: item.summary.isLow ? T.red.bg : T.teal.bg,
                  padding: '6px 8px', borderRadius: 6, textAlign: 'center'
                }}>
                  {fmt2(item.summary.totalLeft)}
                  {item.summary.isLow && <AlertTriangle size={10} style={{ marginLeft: 4, display: 'inline' }} />}
                </div>

                {/* Extra Stay Hours */}
                <div style={{
                  fontSize: 12, fontWeight: 800,
                  color: item.summary.overstayHours > 0 ? T.orange.text : '#cbd5e1',
                  textAlign: 'center'
                }}>
                  {item.summary.overstayHours > 0 ? (
                    <span style={{
                      background: T.orange.bg, padding: '6px 8px', borderRadius: 6,
                      display: 'inline-block'
                    }}>
                      {fmt2(item.summary.overstayHours)}
                    </span>
                  ) : '—'}
                </div>

                {/* Action */}
                <div style={{ textAlign: 'center' }}>
                  <button onClick={() => navigate(window.location.pathname.includes('/teacher') ? `/teacher/flex-report/${item._id}` : `/admin/flex-report/${item._id}`)} style={{
                    width: 32, height: 32, borderRadius: 8, border: 'none',
                    background: '#EFF6FF', color: '#0C2A47', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#0C2A47'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.color = '#0C2A47'; }}
                    title="View detailed report">
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            background: '#fff', borderRadius: 12, padding: '60px 20px',
            border: '1px solid #E2E8F0', textAlign: 'center'
          }}>
            <AlertCircle size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#64748B' }}>
              No students found matching your criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllStudentsFlexReportPage;
