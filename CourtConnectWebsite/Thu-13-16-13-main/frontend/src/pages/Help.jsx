import { useState } from "react";

const faqs = [
  {
    q: "How do I register and verify my email?",
    a: "Sign up with your email and click the verification link (valid for 24 hours). Unverified accounts cannot access the dashboard.",
  },
  {
    q: "I’m locked out after failed logins.",
    a: "For security, 5 failed attempts/hour will trigger a temporary lock. Try again later or reset your password.",
  },
  {
    q: "How do bookings work?",
    a: "Availability is shown in one-hour slots. Choose an available time, then pay via our third-party provider to confirm.",
  },
  {
    q: "Can I cancel a booking?",
    a: "Yes—cancellations are allowed ≥ 2 hours before start time. Refunds follow the payment provider’s policy and platform rules.",
  },
  {
    q: "Do you store card details?",
    a: "No. We only store necessary payment tokens/ids for reconciliation. Card numbers/CVV are not stored by us.",
  },
];

export default function Help() {
  const [open, setOpen] = useState(null);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
      <p className="mt-3 text-gray-700 leading-7">
        Find quick answers below. Still need help? Contact our support team.
      </p>

      <div className="mt-8 space-y-3">
        {faqs.map((item, i) => (
          <div key={i} className="rounded-xl border border-gray-200">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full text-left px-5 py-4 font-medium hover:bg-gray-50 rounded-xl"
            >
              {item.q}
            </button>
            {open === i && (
              <div className="px-5 pb-5 text-gray-700 leading-7">
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
