export const SkeletonCard = () => (
  <div
    className="overflow-hidden"
    style={{
      borderRadius: 20,
      background: 'rgba(255,255,255,0.03)',
      border: '0.5px solid rgba(255,255,255,0.06)'
    }}
  >
    <div
      className="animate-shimmer"
      style={{
        height: 140,
        background:
          'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08), rgba(255,255,255,0.04))'
      }}
    />
    <div className="p-3.5 flex flex-col gap-2">
      <div
        style={{
          height: 10,
          width: '60%',
          borderRadius: 4,
          background: 'rgba(255,255,255,0.06)'
        }}
      />
      <div
        style={{
          height: 10,
          width: '40%',
          borderRadius: 4,
          background: 'rgba(255,255,255,0.04)'
        }}
      />
      <div className="flex gap-1.5 mt-1">
        <div
          style={{
            height: 22,
            width: 60,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.05)'
          }}
        />
        <div
          style={{
            height: 22,
            width: 60,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.05)'
          }}
        />
      </div>
    </div>
  </div>
)
