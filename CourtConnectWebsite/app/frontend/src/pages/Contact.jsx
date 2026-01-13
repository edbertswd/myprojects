export default function Contact() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
        <p className="mt-3 text-gray-700 leading-7">
          For support, partnerships, or security reports, reach out anytime.
          We usually respond within 1–2 business days.
        </p>
      </header>

      <section className="grid md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold">Support</h3>
          <p className="mt-2 text-sm text-gray-700">support@courtconnect.example</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold">Partnerships</h3>
          <p className="mt-2 text-sm text-gray-700">partnerships@courtconnect.example</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold">Security</h3>
          <p className="mt-2 text-sm text-gray-700">security@courtconnect.example</p>
        </div>
      </section>
    </div>
  );
}
