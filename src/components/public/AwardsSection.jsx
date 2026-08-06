// Place the award image at: src/assets/optimized/awards/brain-builder-award-award-vibgyor.webp
// Then update the import path below accordingly
import awardImg from '../../assets/optimized/awards/brain-builder-award-award-vibgyor.webp';
import awardImg1 from '../../assets/optimized/awards/brain-builder-award-award1.webp';

export default function AwardsSection() {
  const topAwards = [
    {
      title: 'Best Preschool',
      desc: 'National Education Excellence',
      badge: 'National · 2026',
      badgeStyle: { background: '#EFF6FF', color: '#1D4ED8' },
      ringStyle: { background: '#EFF6FF' },
      icon: '🏅',
    },
    {
      title: 'Safety First Award',
      desc: 'Child Safety Standards',
      badge: 'Safety · 2025',
      badgeStyle: { background: '#D4F5E4', color: '#0F5029' },
      ringStyle: { background: '#EAFBF0' },
      icon: '🛡️',
    },
    {
      title: 'Innovation in ECE',
      desc: 'Teaching Methodology',
      badge: 'Innovation · 2024',
      badgeStyle: { background: '#C0ECD9', color: '#085041' },
      ringStyle: { background: '#E1F5EE' },
      icon: '💡',
    },
  ];

  return (
    <section style={{ padding: '3rem 1rem', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <p style={{ fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7280', textAlign: 'center', marginBottom: '0.4rem' }}>
        Our achievements
      </p>
      <h2 style={{ fontSize: '22px', fontWeight: 500, color: '#111827', textAlign: 'center', margin: '0 0 0.4rem' }}>
        Awards & Recognition
      </h2>
      <p style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center', margin: '0 0 2rem' }}>
        Celebrated for excellence in early childhood education
      </p>

      {/* Top 3 Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
        marginBottom: '16px',
      }}>
        {topAwards.map((a) => (
          <div key={a.title} style={{
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '1.1rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              ...a.ringStyle,
            }}>
              <span style={{ fontSize: '20px' }}>{a.icon}</span>
            </div>
            <div>
              <span style={{
                fontSize: '11px', fontWeight: 500, padding: '3px 9px',
                borderRadius: '6px', display: 'inline-block', marginBottom: '3px',
                ...a.badgeStyle,
              }}>{a.badge}</span>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#111827', margin: '0', lineHeight: 1.4 }}>{a.title}</p>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0' }}>{a.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Featured VIBGYOR Award — Full Width */}
      <div style={{
        width: '100%',
        boxSizing: 'border-box',
        border: '2px solid #C9971A',
        borderRadius: '16px',
        background: '#FFFBF0',
        padding: '1.5rem 1.75rem',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap',
      }}>

        {/* Award Image with gradient border ring */}
        <div style={{
          flexShrink: 0,
          padding: '3px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f6d365 0%, #C9971A 25%, #fda085 50%, #B8860B 75%, #f6d365 100%)',
          boxShadow: '0 0 18px rgba(201,151,26,0.45), 0 4px 16px rgba(0,0,0,0.12)',
        }}>
          <div style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid #FFFBF0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FFF8E0',
          }}>
            <img
              src={awardImg}
              alt="VIBGYOR Best Community Engagement Award"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%',
                display: 'block',
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: '220px' }}>
          <span style={{
            display: 'inline-block', fontSize: '11px', fontWeight: 500,
            padding: '3px 10px', borderRadius: '6px',
            background: '#FFF0C0', color: '#7A5200', marginBottom: '8px', letterSpacing: '0.03em',
          }}>
            Featured Award 
          </span>

          <p style={{ fontSize: '13px', color: '#8A6500', margin: '0 0 4px', fontWeight: 400 }}>
            The Radiance Preschool Excellence Award for
          </p>
          <p style={{ fontSize: '17px', fontWeight: 600, color: '#5C3D00', margin: '0 0 6px', lineHeight: 1.4 }}>
            Best Community Engagement and Social Service
          </p>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#7A5200', margin: '0 0 4px' }}>
            Zorix School
          </p>
          <p style={{ fontSize: '12px', color: '#A07820', margin: '0 0 4px', lineHeight: 1.5 }}>
            Celebrating their dedication to excellence in early childhood education and unwavering commitment to nurturing young minds.
          </p>
          <p style={{ fontSize: '11px', color: '#B8860B', margin: '4px 0 0', fontWeight: 500, letterSpacing: '0.05em' }}>
            Presented by{' '}
            <span style={{
              fontWeight: 600, fontSize: '13px',
              background: 'linear-gradient(90deg, #e22,#e72,#bb0,#282,#22a,#72c)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              VIBGYOR Group of Schools
            </span>
          </p>
        </div>
      </div>
      <div style={{
        width: '100%',
        marginTop: '10px',
        boxSizing: 'border-box',
        border: '2px solid #C9971A',
        borderRadius: '16px',
        background: '#FFFBF0',
        padding: '1.5rem 1.75rem',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap',
      }}>

        {/* Award Image with gradient border ring */}
        <div style={{
          flexShrink: 0,
          padding: '3px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f6d365 0%, #C9971A 25%, #fda085 50%, #B8860B 75%, #f6d365 100%)',
          boxShadow: '0 0 18px rgba(201,151,26,0.45), 0 4px 16px rgba(0,0,0,0.12)',
        }}>
          <div style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid #FFFBF0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FFF8E0',
          }}>
            <img
              src={awardImg1}
              alt="VIBGYOR Best Community Engagement Award"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%',
                display: 'block',
              }}
            />
          </div>
        </div>

        {/* Content */}
      <div style={{ flex: 1, minWidth: '220px' }}>
  <span
    style={{
      display: 'inline-block',
      fontSize: '11px',
      fontWeight: 500,
      padding: '3px 10px',
      borderRadius: '6px',
      background: '#FFF0C0',
      color: '#7A5200',
      marginBottom: '8px',
      letterSpacing: '0.03em',
    }}
  >
    Featured Award
  </span>

  <p
    style={{
      fontSize: '13px',
      color: '#8A6500',
      margin: '0 0 4px',
      fontWeight: 400,
    }}
  >
    Third Prize Award
  </p>

  <p
    style={{
      fontSize: '17px',
      fontWeight: 600,
      color: '#5C3D00',
      margin: '0 0 6px',
      lineHeight: 1.4,
    }}
  >
    Indore Zoological Park Competition
  </p>

  <p
    style={{
      fontSize: '14px',
      fontWeight: 500,
      color: '#7A5200',
      margin: '0 0 4px',
    }}
  >
    Municipal Corporation, Indore
  </p>

  <p
    style={{
      fontSize: '12px',
      color: '#A07820',
      margin: '0 0 4px',
      lineHeight: 1.5,
    }}
  >
    Awarded for securing <strong>Third Prize</strong> in the Indore Zoological
    Park competition. This recognition reflects dedication, participation, and
    outstanding performance.
  </p>

  <p
    style={{
      fontSize: '11px',
      color: '#B8860B',
      margin: '4px 0 0',
      fontWeight: 500,
      letterSpacing: '0.05em',
    }}
  >
    Presented by{" "}
    <span
      style={{
        fontWeight: 600,
        fontSize: '13px',
        color: '#8B5A00',
      }}
    >
      Indore Zoological Park <br />
      Municipal Corporation, Indore
    </span>
  </p>
</div>
      </div>
    </section>
  );
}
