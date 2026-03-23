export default function StatCard({ icon, value, label, sub, color = '#639922' }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '20px',
      border: '1px solid rgba(0,0,0,0.07)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a', lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>{label}</div>
          {sub && <div style={{ fontSize: 12, color: color, marginTop: 4, fontWeight: 500 }}>{sub}</div>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
    </div>
  )
}
