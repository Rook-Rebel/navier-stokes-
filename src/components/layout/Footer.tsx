import { Disclaimer } from '../common/Disclaimer';

export function Footer() {
  return (
    <footer style={{ padding: '48px 32px 60px', borderTop: '1px solid var(--border-faint)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Disclaimer />
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem', marginTop: 18, lineHeight: 1.7 }}>
          ნავიე-სტოქსის სინგულარობა — საგანმანათლებლო ინტერაქტიული ვიზუალიზაცია. აგებულია React, Three.js და React Three Fiber-ის გამოყენებით. სამეცნიერო წყაროები იხილეთ ზემოთ, „წყაროები და მტკიცება“ განყოფილებაში.
        </p>
        <p className="footer-credit">ალექსანდრე გაგანაშვილი — თანაავტორი</p>
      </div>
    </footer>
  );
}
