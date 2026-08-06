import { useState, useRef, useEffect } from 'react';

// Default theme colors (can be overridden via props)
const THEME_COLORS = {
  admin: {
    primary: '#E53935',
    primaryLight: '#FEE2E2',
    primaryDark: '#B91C1C',
    accent: '#FB8C00',
    bg: '#FEF2F2',
  },
  parent: {
    primary: '#8B5CF6',
    primaryLight: '#EDE9FE',
    primaryDark: '#6D28D9',
    accent: '#EC4899',
    bg: '#F5F3FF',
  },
  teacher: {
    primary: '#16A34A',
    primaryLight: '#DCFCE7',
    primaryDark: '#15803D',
    accent: '#22C55E',
    bg: '#F0FFF4',
  },
};

const TAG_COLORS = {
  parent: { bg: '#DCFCE7', text: '#15803D' },
  admin: { bg: '#EDE9FE', text: '#6D28D9' },
  staff: { bg: '#DBEAFE', text: '#1D4ED8' },
  teacher: { bg: '#D1FAE5', text: '#047857' },
  child: { bg: '#FEE2E2', text: '#B91C1C' },
};

export default function ChatMessageComponent({
  role = 'admin',
  conversations: initialConvos = [],
  pageTitle = 'Messages',
  pageSubtitle = 'Communicate with others',
}) {
  const theme = THEME_COLORS[role] || THEME_COLORS.admin;
  
  const [convos, setConvos] = useState(initialConvos);
  const [selected, setSelected] = useState(initialConvos[0] || null);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [showCompose, setShowCompose] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', message: '' });
  
  const msgEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [selected]);

  const totalUnread = convos.reduce((s, c) => s + c.unread, 0);

  const filtered = convos.filter(c => {
    const matchSearch = c.from.toLowerCase().includes(search.toLowerCase()) || 
                        c.subject.toLowerCase().includes(search.toLowerCase());
    const matchTag = filterTag === 'all' || c.tag === filterTag;
    return matchSearch && matchTag;
  });

  const handleSelect = (c) => {
    setSelected(c);
    setShowDetail(true);
    setConvos(prev => prev.map(x => x.id === c.id ? { ...x, unread: 0 } : x));
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    const newMsg = { 
      id: Date.now(), 
      from: role === 'admin' ? 'Admin' : role === 'parent' ? 'Parent' : 'You', 
      text: replyText.trim(), 
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), 
      self: true 
    };
    setConvos(prev => prev.map(c => c.id === selected.id ? { ...c, messages: [...c.messages, newMsg], preview: replyText.trim(), time: 'Just now' } : c));
    setSelected(prev => ({ ...prev, messages: [...prev.messages, newMsg] }));
    setReplyText('');
  };

  const handleSendCompose = () => {
    if (!composeData.to.trim() || !composeData.message.trim()) return;
    
    const newConvo = {
      id: Date.now(),
      from: composeData.to,
      role: 'Parent',
      avatar: composeData.to.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      avatarColor: `linear-gradient(135deg,${theme.primary},${theme.accent})`,
      subject: composeData.subject || 'New Message',
      preview: composeData.message,
      time: 'Just now',
      date: 'Today',
      unread: 0,
      tag: 'parent',
      messages: [
        { id: Date.now(), from: role === 'admin' ? 'Admin' : 'You', text: composeData.message, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), self: true }
      ],
    };
    
    setConvos(prev => [newConvo, ...prev]);
    setSelected(newConvo);
    setShowCompose(false);
    setComposeData({ to: '', subject: '', message: '' });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply();
  };

  const handleComposeKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSendCompose();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Baloo+2:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .cm-root { font-family: 'Nunito', sans-serif; height: calc(100vh - 64px - 48px); display: flex; flex-direction: column; min-height: 0; }

        /* Header */
        .cm-header { flex-shrink: 0; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }

        /* Body */
        .cm-body { flex: 1; display: grid; grid-template-columns: 320px 1fr; gap: 16px; min-height: 0; overflow: hidden; }
        @media (max-width: 768px) {
          .cm-body { grid-template-columns: 1fr; }
          .cm-right-pane { display: none; }
          .cm-right-pane.mobile-show { display: flex !important; }
          .cm-left-pane.mobile-hide { display: none !important; }
        }

        /* Left pane */
        .cm-left-pane { display: flex; flex-direction: column; background: #fff; border-radius: 18px; border: 1px solid #E2E8F0; overflow: hidden; min-height: 0; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }

        .cm-search-row { padding: 14px 14px 10px; border-bottom: 1px solid #F1F5F9; flex-shrink: 0; }
        .cm-search-input { width: 100%; padding: 9px 14px 9px 38px; border-radius: 11px; border: 1.5px solid #E2E8F0; background: #F8FAFC; font-family: 'Nunito', sans-serif; font-size: 13px; font-weight: 600; color: #0F172A; outline: none; transition: border-color .2s, box-shadow .2s; }
        .cm-search-input:focus { border-color: ${theme.primary}; background: #fff; box-shadow: 0 0 0 3px ${theme.primaryLight.replace(')', ', 0.1)').replace('rgba', 'rgba')}; }
        .cm-search-input::placeholder { color: #94A3B8; }

        .cm-filters { display: flex; gap: 6px; padding: 10px 14px; border-bottom: 1px solid #F1F5F9; flex-shrink: 0; }
        .cm-filter-btn { padding: 5px 12px; border-radius: 99px; border: none; font-family: 'Nunito', sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; transition: all .15s; }
        .cm-filter-btn.active { background: ${theme.primary}; color: #fff; box-shadow: 0 2px 8px ${theme.primaryLight.replace(')', ', 0.3)').replace('rgba', 'rgba')}; }
        .cm-filter-btn:not(.active) { background: #F1F5F9; color: #64748B; }
        .cm-filter-btn:not(.active):hover { background: #E2E8F0; }

        .cm-conv-list { flex: 1; overflow-y: auto; }
        .cm-conv-list::-webkit-scrollbar { width: 4px; }
        .cm-conv-list::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 99px; }

        .cm-conv-row { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; cursor: pointer; transition: background .15s; border-bottom: 1px solid #F8FAFC; position: relative; }
        .cm-conv-row:hover { background: #F8FAFF; }
        .cm-conv-row.active { background: ${theme.bg}; }
        .cm-conv-row.unread { background: #FAFFFE; }
        .cm-conv-row.active::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:linear-gradient(180deg,${theme.primary},${theme.accent}); border-radius:0 3px 3px 0; }

        .cm-conv-avatar { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-family: 'Baloo 2', cursive; font-size: 14px; font-weight: 800; color: #fff; flex-shrink: 0; }

        /* Right pane */
        .cm-right-pane { display: flex; flex-direction: column; min-height: 0; border-radius: 18px; overflow: hidden; border: 1px solid #E2E8F0; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }

        .cm-chat-header { flex-shrink: 0; padding: 16px 20px; border-bottom: 1px solid #F1F5F9; display: flex; align-items: center; gap: 12px; background: #fff; }

        .cm-chat-scroll { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; background: #F8FAFC; }
        .cm-chat-scroll::-webkit-scrollbar { width: 4px; }
        .cm-chat-scroll::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 99px; }

        .cm-bubble-wrap { display: flex; align-items: flex-end; gap: 8px; }
        .cm-bubble-wrap.self { flex-direction: row-reverse; }
        .cm-bubble { max-width: 72%; padding: 11px 15px; border-radius: 16px; font-size: 13.5px; line-height: 1.55; font-weight: 500; }
        .cm-bubble.other { background: #fff; color: #0F172A; border-bottom-left-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
        .cm-bubble.self  { background: linear-gradient(135deg,${theme.primary},${theme.primaryDark}); color: #fff; border-bottom-right-radius: 4px; box-shadow: 0 2px 10px ${theme.primaryLight.replace(')', ', 0.4)').replace('rgba', 'rgba')}; }

        .cm-reply-box { flex-shrink: 0; padding: 14px 16px; border-top: 1px solid #F1F5F9; background: #fff; display: flex; gap: 10px; align-items: flex-end; }
        .cm-reply-textarea { flex: 1; resize: none; padding: 11px 14px; border: 1.5px solid #E2E8F0; border-radius: 14px; font-family: 'Nunito', sans-serif; font-size: 13.5px; font-weight: 500; color: #0F172A; outline: none; line-height: 1.5; min-height: 44px; max-height: 120px; overflow-y: auto; transition: border-color .2s, box-shadow .2s; }
        .cm-reply-textarea:focus { border-color: ${theme.primary}; box-shadow: 0 0 0 3px ${theme.primaryLight.replace(')', ', 0.1)').replace('rgba', 'rgba')}; }
        .cm-reply-textarea::placeholder { color: #94A3B8; }
        .cm-send-btn { width: 44px; height: 44px; border-radius: 13px; background: linear-gradient(135deg,${theme.primary},${theme.primaryDark}); border: none; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform .2s, box-shadow .2s; flex-shrink: 0; box-shadow: 0 4px 12px ${theme.primaryLight.replace(')', ', 0.35)').replace('rgba', 'rgba')}; }
        .cm-send-btn:hover { transform: scale(1.06); box-shadow: 0 6px 16px ${theme.primaryLight.replace(')', ', 0.45)').replace('rgba', 'rgba')}; }
        .cm-send-btn:active { transform: scale(0.97); }

        .cm-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: 10px; color: #94A3B8; padding: 40px; text-align: center; }

        .cm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); backdrop-filter: blur(6px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; animation: cmFadeIn .2s ease; }
        @keyframes cmFadeIn { from{opacity:0} to{opacity:1} }
        .cm-modal { background: #fff; border-radius: 22px; width: 100%; max-width: 500px; box-shadow: 0 24px 60px rgba(0,0,0,.2); animation: cmSlideUp .25s cubic-bezier(.34,1.2,.64,1); overflow: hidden; }
        @keyframes cmSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

        .cm-modal-header { padding: 20px 22px 16px; border-bottom: 1px solid #F1F5F9; display: flex; align-items: center; justify-content: space-between; }
        .cm-modal-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 14px; }
        .cm-modal-footer { padding: 0 22px 20px; display: flex; gap: 10px; }

        .cm-field-label { font-size: 12px; font-weight: 800; color: #475569; margin-bottom: 5px; text-transform: uppercase; letter-spacing: .04em; }
        .cm-field-input { width: 100%; padding: 10px 14px; border: 1.5px solid #E2E8F0; border-radius: 12px; font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 600; color: #0F172A; outline: none; transition: border-color .2s, box-shadow .2s; background: #F8FAFC; }
        .cm-field-input:focus { border-color: ${theme.primary}; background: #fff; box-shadow: 0 0 0 3px ${theme.primaryLight.replace(')', ', 0.1)').replace('rgba', 'rgba')}; }
        .cm-field-input::placeholder { color: #94A3B8; font-weight: 500; }

        .cm-btn-primary { padding: 12px 22px; border-radius: 12px; border: none; background: linear-gradient(135deg,${theme.primary},${theme.primaryDark}); color: #fff; font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 800; cursor: pointer; transition: transform .2s, box-shadow .2s; box-shadow: 0 4px 14px ${theme.primaryLight.replace(')', ', 0.35)').replace('rgba', 'rgba')}; flex: 1; }
        .cm-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 18px ${theme.primaryLight.replace(')', ', 0.45)').replace('rgba', 'rgba')}; }
        .cm-btn-ghost { padding: 12px 22px; border-radius: 12px; border: 1.5px solid #E2E8F0; background: #fff; color: #64748B; font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: background .15s, border-color .15s; flex: 1; }
        .cm-btn-ghost:hover { background: #F8FAFC; border-color: #CBD5E1; }

        .cm-close-btn { width: 32px; height: 32px; border-radius: 9px; background: #F1F5F9; border: none; color: #64748B; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .15s; }
        .cm-close-btn:hover { background: #E2E8F0; }

        .cm-back-btn { display: none; width: 32px; height: 32px; border-radius: 9px; background: #F1F5F9; border: none; color: #374151; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        @media (max-width: 768px) { .cm-back-btn { display: flex; } }

        .cm-compose-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 13px; border: none; background: linear-gradient(135deg,${theme.primary},${theme.primaryDark}); color: #fff; font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 14px ${theme.primaryLight.replace(')', ', 0.35)').replace('rgba', 'rgba')}; transition: transform .2s, box-shadow .2s; }
        .cm-compose-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px ${theme.primaryLight.replace(')', ', 0.45)').replace('rgba', 'rgba')}; }
      `}</style>

      <div className="cm-root">
        {/* Header */}
        <div className="cm-header">
          <div>
            <p style={{ fontFamily:"'Baloo 2',cursive", fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
              {pageTitle}
            </p>
            <p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0', fontWeight: 600 }}>
              {pageSubtitle}
              {totalUnread > 0 && (
                <span style={{ marginLeft: 8, padding: '2px 9px', borderRadius: 99, background: theme.primaryLight, color: theme.primaryDark, fontSize: 11, fontWeight: 800 }}>
                  {totalUnread} unread
                </span>
              )}
            </p>
          </div>
          <button className="cm-compose-btn" onClick={() => setShowCompose(true)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Compose
          </button>
        </div>

        {/* Body */}
        <div className="cm-body">
          {/* Left pane */}
          <div className={`cm-left-pane${showDetail ? ' mobile-hide' : ''}`}>
            <div className="cm-search-row">
              <div style={{ position: 'relative' }}>
                <svg width="15" height="15" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input className="cm-search-input" placeholder="Search messages…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="cm-filters">
              {['all', 'parent', 'admin', 'teacher', 'staff'].filter(t => 
                role === 'admin' ? ['all', 'parent', 'teacher', 'staff'].includes(t) :
                role === 'parent' ? ['all', 'teacher', 'admin', 'child'].includes(t) :
                ['all', 'parent', 'admin', 'staff'].includes(t)
              ).map(t => (
                <button key={t} className={`cm-filter-btn${filterTag === t ? ' active' : ''}`} onClick={() => setFilterTag(t)}>
                  {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div className="cm-conv-list">
              {filtered.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>No messages found</p>
                </div>
              ) : filtered.map(c => (
                <div
                  key={c.id}
                  className={`cm-conv-row${selected?.id === c.id ? ' active' : ''}${c.unread > 0 ? ' unread' : ''}`}
                  onClick={() => handleSelect(c)}
                >
                  <div className="cm-conv-avatar" style={{ background: c.avatarColor }}>{c.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <p style={{ fontSize: 13.5, fontWeight: c.unread > 0 ? 800 : 600, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.from}
                      </p>
                      <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, flexShrink: 0, marginLeft: 6 }}>{c.time}</span>
                    </div>
                    <p style={{ fontSize: 12.5, fontWeight: c.unread > 0 ? 700 : 500, color: c.unread > 0 ? '#0F172A' : '#64748B', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.subject}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight: 500 }}>
                        {c.preview}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        {TAG_COLORS[c.tag] && (
                          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: TAG_COLORS[c.tag].bg, color: TAG_COLORS[c.tag].text }}>
                            {c.tag}
                          </span>
                        )}
                        {c.unread > 0 && (
                          <span style={{ minWidth: 18, height: 18, padding: '0 4px', borderRadius: 99, background: theme.primary, color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(22,163,74,.4)' }}>
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right pane */}
          <div className={`cm-right-pane${showDetail ? ' mobile-show' : ''}`}>
            {!selected ? (
              <div className="cm-empty">
                <svg width="48" height="48" fill="none" stroke="#CBD5E1" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#94A3B8', margin: 0 }}>Select a conversation</p>
                <p style={{ fontSize: 13, color: '#CBD5E1', margin: 0 }}>Choose a message from the left to read and reply</p>
              </div>
            ) : (
              <>
                <div className="cm-chat-header">
                  <button className="cm-back-btn" onClick={() => setShowDetail(false)}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="cm-conv-avatar" style={{ background: selected.avatarColor, width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Baloo 2',cursive", fontSize: 14, fontWeight: 800, color: '#fff' }}>
                    {selected.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontFamily: "'Baloo 2',cursive", fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>{selected.from}</p>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: TAG_COLORS[selected.tag]?.bg || theme.primaryLight, color: TAG_COLORS[selected.tag]?.text || theme.primaryDark }}>
                        {selected.role}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: '#64748B', margin: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.subject}</p>
                  </div>
                  <button style={{ width: 34, height: 34, borderRadius: 10, background: '#F1F5F9', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                </div>

                <div className="cm-chat-scroll">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 8px' }}>
                    <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
                    <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>{selected.date}</span>
                    <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
                  </div>

                  {selected.messages.map((msg, idx) => (
                    <div key={msg.id} className={`cm-bubble-wrap${msg.self ? ' self' : ''}`}>
                      {!msg.self && idx === 0 && (
                        <div className="cm-conv-avatar" style={{ background: selected.avatarColor, width: 32, height: 32, borderRadius: 10, fontSize: 11, flexShrink: 0 }}>
                          {selected.avatar}
                        </div>
                      )}
                      {!msg.self && idx > 0 && <div style={{ width: 32, flexShrink: 0 }} />}
                      <div>
                        <div className={`cm-bubble${msg.self ? ' self' : ' other'}`}>
                          {msg.text}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>{msg.time}</span>
                          {msg.self && (
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ color: '#fff' }}>
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={msgEndRef} />
                </div>

                <div className="cm-reply-box">
                  <textarea
                    ref={textareaRef}
                    className="cm-reply-textarea"
                    placeholder="Type your message... (Ctrl/Cmd + Enter to send)"
                    rows={1}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button className="cm-send-btn" onClick={handleReply}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Compose Modal */}
        {showCompose && (
          <div className="cm-overlay" onClick={() => setShowCompose(false)}>
            <div className="cm-modal" onClick={e => e.stopPropagation()}>
              <div className="cm-modal-header">
                <div>
                  <p style={{ fontFamily:"'Baloo 2',cursive", fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Compose Message</p>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0', fontWeight: 600 }}>Send a new message</p>
                </div>
                <button className="cm-close-btn" onClick={() => setShowCompose(false)}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="cm-modal-body">
                <div>
                  <p className="cm-field-label">To</p>
                  <input
                    className="cm-field-input"
                    placeholder="Enter recipient name"
                    value={composeData.to}
                    onChange={e => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>
                <div>
                  <p className="cm-field-label">Subject</p>
                  <input
                    className="cm-field-input"
                    placeholder="Enter subject (optional)"
                    value={composeData.subject}
                    onChange={e => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                <div>
                  <p className="cm-field-label">Message</p>
                  <textarea
                    className="cm-field-input"
                    placeholder="Type your message..."
                    rows={5}
                    value={composeData.message}
                    onChange={e => setComposeData(prev => ({ ...prev, message: e.target.value }))}
                    onKeyDown={handleComposeKeyDown}
                    style={{ resize: 'vertical', minHeight: 100 }}
                  />
                </div>
              </div>

              <div className="cm-modal-footer">
                <button className="cm-btn-ghost" onClick={() => setShowCompose(false)}>Cancel</button>
                <button className="cm-btn-primary" onClick={handleSendCompose}>Send Message</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
