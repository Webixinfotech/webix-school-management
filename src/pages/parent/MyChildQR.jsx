import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function MyChildQR() {
  const { user }            = useAuth();
  const [student, setStudent] = useState(null);
  // Multi-class students can have more than one attendance record for the
  // same day (e.g. Morning + Afternoon sessions) - keep the full list.
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const fetchChildQRData = async () => {
      try {
        const res = await api.get('/students/my-children');
        const childrenList = res.data?.data || res.data || [];

        let selectedChild = childrenList[0];
        if (user?.children?.[0]?.id) {
          selectedChild = childrenList.find(c => c.id === user.children[0].id || c._id === user.children[0].id) || selectedChild;
        }
        setStudent(selectedChild);

        if (selectedChild) {
          const childId = selectedChild.id || selectedChild._id;
          const today = new Date().toISOString().split('T')[0];

          // Fetch today's attendance
          const attRes = await api.get(`/attendance/student/${childId}`, {
            params: { dateFrom: today, dateTo: today }
          }).catch(() => null);

          const rawRecords = attRes?.data?.data?.data || [];
          setRecords(rawRecords);
        }
      } catch (error) {
        console.error('Error fetching child data:', error);
      }
    };

    if (user) fetchChildQRData();
  }, [user]);

  if (!student) return (
    <div className="flex items-center justify-center min-h-screen">
      <p style={{ color: '#7A90AA' }}>Loading...</p>
    </div>
  );

  function downloadQR() {
    const canvas = document.getElementById('child-qr');
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = `QR-${student.fullName || student.firstName}.png`;
    a.href = canvas.toDataURL();
    a.click();
  }

  const childName = student.fullName || student.firstName || 'Your Child';
  const className = student.className || 'Class N/A';
  const childId = student.admissionNo || student.enrollmentId || student._id;
  const parentName = student.parentDetails?.primaryName || student.parentDetails?.fatherName || 'Parent';
  const qrValue = student.qrCode || `STUDENT-${childId}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Poppins:wght@400;500;600&display=swap');
        .p-root { font-family: 'Poppins', sans-serif; }
        .p-display { font-family: 'Nunito', sans-serif; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);} }
        .fade-up { animation: fadeUp 0.5s both; }
      `}</style>

      <div className="p-root min-h-screen py-10 px-4" style={{ background: 'linear-gradient(150deg,#F0F9FF,#FFFDF5)' }}>
        <div className="max-w-md mx-auto">

          {/* Header */}
          <div className="fade-up text-center mb-8">
            <h1 className="p-display font-black text-2xl" style={{ color: '#0B3A64' }}>
              My Child's QR
            </h1>
            <p className="text-sm mt-1" style={{ color: '#5A7A96' }}>
              Ye QR school mein attendance ke liye use hoga
            </p>
          </div>

          {/* Child info card */}
          <div className="fade-up rounded-3xl overflow-hidden mb-5"
            style={{ background: 'white', border: '1.5px solid rgba(41,169,225,0.15)', boxShadow: '0 12px 40px rgba(11,58,100,0.1)', animationDelay: '0.1s' }}>

            <div className="h-2" style={{ background: 'linear-gradient(90deg,#29A9E1,#BEDB39,#F28E3A)' }} />

            <div className="p-6">
              {/* Student details */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl"
                  style={{ background: 'linear-gradient(135deg,#29A9E1,#0B3A64)' }}>
              {childName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="p-display font-black text-xl" style={{ color: '#0B3A64' }}>
                {childName}
                  </h2>
          
                </div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-2xl" style={{ background: '#F8FEFF', border: '1.5px solid #29A9E122' }}>
                  <QRCodeCanvas
                    id="child-qr"
                value={qrValue}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#0B3A64"
                    level="M"
                  />
                </div>
              </div>

              {/* Today status - one card per session (multi-class students can have more than one) */}
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#7A90AA' }}>
                Aaj ka Status — {new Date().toDateString()}
              </p>
              {records.length === 0 ? (
                <div className="rounded-2xl p-4 mb-4" style={{ background: '#F8FAFC', border: '1.5px solid #e2e8f0' }}>
                  <p className="font-semibold text-sm" style={{ color: '#94a3b8' }}>Abhi school nahi aaye</p>
                </div>
              ) : (
                records.map((record, idx) => (
                  <div key={record._id || idx} className="rounded-2xl p-4 mb-4"
                    style={{
                      background: record.checkOutTime ? '#FFF0F0' : '#F0FFF5',
                      border: `1.5px solid ${record.checkOutTime ? '#E8292822' : '#22c55e22'}`,
                    }}>
                    {records.length > 1 && record.sessionLabel && (
                      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#29A9E1' }}>
                        {record.sessionLabel}
                      </p>
                    )}
                    {record.status?.toLowerCase() === 'absent' ? (
                      <p className="font-semibold text-sm" style={{ color: '#94a3b8' }}>Absent Today</p>
                    ) : (
                      <div className="flex gap-6">
                        <div>
                          <p className="text-xs" style={{ color: '#7A90AA' }}>Check In</p>
                          <p className="p-display font-black text-lg" style={{ color: '#22c55e' }}>
                            {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Marked Present'}
                          </p>
                        </div>
                        {record.checkOutTime && (
                          <div>
                            <p className="text-xs" style={{ color: '#7A90AA' }}>Check Out</p>
                            <p className="p-display font-black text-lg" style={{ color: '#E82928' }}>
                              {new Date(record.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        )}
                        {!record.checkOutTime && record.checkInTime && (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm font-semibold" style={{ color: '#22c55e' }}>
                              Abhi school mein hai
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Download */}
              <button onClick={downloadQR}
                className="w-full py-3 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#0B3A64,#1A5A96)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                QR Download Karo
              </button>
            </div>
          </div>

          <p className="text-center text-xs fade-up" style={{ color: '#94a3b8', animationDelay: '0.3s' }}>
        Ye QR sirf {childName} ke liye hai · Kisi aur ko share mat karo
          </p>
        </div>
      </div>
    </>
  );
}
