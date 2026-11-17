export function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-ring" aria-hidden="true" />
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ვიზუალიზაცია იტვირთება...</p>
    </div>
  );
}
