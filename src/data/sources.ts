export type SourceCategory = 'primary' | 'formalization' | 'official-problem';

export interface SourceCard {
  organization: string;
  title: string;
  date?: string;
  description: string;
  url: string;
  linkLabel: string;
  category: SourceCategory;
}

export const SOURCE_CATEGORY_LABELS: Record<SourceCategory, string> = {
  primary: 'ძირითადი წყარო',
  formalization: 'ფორმალიზაცია',
  'official-problem': 'პრობლემის ოფიციალური ფორმულირება',
};

/**
 * Every URL here was verified live (web search + fetch) before being written
 * into the app. Nothing here is an invented DOI, author, or quote. The
 * underlying claim itself (an OpenAI-produced proof of finite-time blow-up
 * for a forced Navier-Stokes system, with an accompanying Lean
 * formalization) is real and dated 8 September 2026 — but as of writing,
 * broad independent mathematical review and any official Clay Mathematics
 * Institute recognition are both still pending, which is why the
 * "Scientific status" section below distinguishes them explicitly.
 */
export const SOURCES: SourceCard[] = [
  {
    organization: 'OpenAI',
    title: 'On the Navier–Stokes Millennium Prize Problem',
    date: '8 სექტემბერი, 2026',
    description:
      'ოფიციალური განცხადება, სადაც აღწერილია სასრულ დროში სინგულარობის (finite-time blow-up) კონსტრუქცია იძულებული (forced) სამგანზომილებიანი ნავიე-სტოქსის სისტემისთვის.',
    url: 'https://openai.com/index/navier-stokes-solution/',
    linkLabel: 'მტკიცების ნახვა',
    category: 'primary',
  },
  {
    organization: 'OpenAI GitHub',
    title: 'NavierStokesAndEuler',
    description:
      'Lean 4 / Mathlib ფორმალიზაცია, რომელიც თან ახლავს ნავიე-სტოქსისა და ეილერის განტოლებებისთვის სასრულ დროში სინგულარობის შედეგებს (მათ შორის დამოუკიდებელი შემოწმებისთვის განკუთვნილი „ComparatorChallenges“ დირექტორია).',
    url: 'https://github.com/openai/NavierStokesAndEuler',
    linkLabel: 'Lean ფორმალიზაცია',
    category: 'formalization',
  },
  {
    organization: 'Clay Mathematics Institute',
    title: 'Navier–Stokes Existence and Smoothness — ოფიციალური პრობლემის აღწერა',
    description:
      'მილენიუმის პრობლემის ორიგინალური, ოფიციალური ფორმულირება (ავტორი: Charles L. Fefferman), რომელსაც ეყრდნობა ყველა შემდგომი შეფასება.',
    url: 'https://www.claymath.org/wp-content/uploads/2022/06/navierstokes.pdf',
    linkLabel: 'ოფიციალური პრობლემის აღწერა',
    category: 'official-problem',
  },
  {
    organization: 'Clay Mathematics Institute',
    title: 'Navier-Stokes Announcement',
    description:
      'Clay Mathematics Institute-ის საჯარო რეაქცია: აღნიშნავენ, რომ პრობლემა „როგორც ჩანს, გადაწყვეტილია“, თუმცა შეფასების პროცესი განზრახ არაჩქარებულია და პრიზი ჯერ არ არის მინიჭებული.',
    url: 'https://www.claymath.org/news/navier-stokes-announcement/',
    linkLabel: 'განცხადების ნახვა',
    category: 'official-problem',
  },
];
