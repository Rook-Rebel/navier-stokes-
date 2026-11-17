interface DisclaimerProps {
  compact?: boolean;
}

/** The mandatory scientific disclaimer — must stay visible somewhere on the page at all times. */
export function Disclaimer({ compact }: DisclaimerProps) {
  return (
    <div className="disclaimer-banner" role="note">
      {compact ? '⚠ ' : null}
      „ეს ვიზუალიზაცია წარმოადგენს მტკიცების მექანიზმის ინტერაქტიულ სასწავლო მოდელს და არა 166-გვერდიანი მათემატიკური მტკიცების სრულ რიცხვით სიმულაციას.“
    </div>
  );
}
