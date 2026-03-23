export default function ColorPicker({ label, value, onChange }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: 48, height: 48, borderRadius: 10, border: '1.5px solid #e5e7eb',
            cursor: 'pointer', padding: 3, background: '#fff',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', fontFamily: 'monospace' }}>{value}</span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>Cliquer pour changer</span>
        </div>
        <div style={{
          width: 80, height: 32, borderRadius: 8,
          background: value,
          border: '1px solid rgba(0,0,0,0.1)',
          marginLeft: 'auto',
        }} />
      </div>
    </div>
  )
}

const labelStyle = {
  fontSize: 12, fontWeight: 700, color: '#9ca3af',
  textTransform: 'uppercase', letterSpacing: 0.8, display: 'block',
}
