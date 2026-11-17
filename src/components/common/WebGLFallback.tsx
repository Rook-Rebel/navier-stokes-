export function WebGLFallback() {
  return (
    <div className="webgl-fallback" role="alert">
      <p style={{ fontSize: '2rem' }}>⚠</p>
      <p style={{ color: 'var(--text-primary)', fontSize: '1rem', maxWidth: 420 }}>
        თქვენი ბრაუზერი ამ 3D ვიზუალიზაციისთვის საჭირო WebGL-ს ვერ იყენებს.
      </p>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', maxWidth: 420 }}>
        სცადეთ სხვა ან განახლებული ბრაუზერი, ან შეამოწმეთ, რომ აპარატურული აჩქარება ჩართულია ბრაუზერის პარამეტრებში.
      </p>
    </div>
  );
}
