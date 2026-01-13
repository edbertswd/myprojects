export default function Privacy() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="text-gray-700 leading-7">
        This sample is for coursework/demos only. Consult legal counsel before production use.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Information We Collect</h2>
        <ul className="list-disc pl-6 text-gray-700 leading-7 space-y-1">
          <li>Account data (name, email, avatar, role, verification state).</li>
          <li>Booking and transaction data (orders, timeslots, status, history).</li>
          <li>Payment tokens/ids from providers (no card number/CVV stored).</li>
          <li>Logs and device info (IP, browser, timestamps, security events).</li>
          <li>Usage data for improvements (de-identified/aggregated where appropriate).</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">How We Use Data</h2>
        <ul className="list-disc pl-6 text-gray-700 leading-7 space-y-1">
          <li>Provide and maintain services (search, booking, payments, cancellations).</li>
          <li>Account security (rate-limits, lockouts, MFA, audit trails).</li>
          <li>Customer support and communications.</li>
          <li>Compliance, disputes, analytics, and product improvements.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Sharing</h2>
        <ul className="list-disc pl-6 text-gray-700 leading-7 space-y-1">
          <li>Payment and messaging providers, for service delivery.</li>
          <li>Cloud/hosting vendors for infrastructure.</li>
          <li>Legal compliance or protection of rights.</li>
          <li>Business transactions (e.g., merger) per applicable law.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Security</h2>
        <p className="text-gray-700 leading-7">
          Encryption in transit and at rest, short-lived sessions (≤24h), access control,
          audit logs, backups, and least-privilege practices.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Retention & Your Rights</h2>
        <p className="text-gray-700 leading-7">
          We retain data only as needed to provide the service or as required by law.
          You may request access, correction, or deletion where applicable.
          Contact: privacy@courtconnect.example
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Cookies</h2>
        <p className="text-gray-700 leading-7">
          Used for login, preferences, and analytics. Disabling cookies may limit functionality.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Changes</h2>
        <p className="text-gray-700 leading-7">
          We may update this Policy. Continued use indicates acceptance of updates.
        </p>
      </section>
    </div>
  );
}
