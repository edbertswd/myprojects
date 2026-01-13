export default function Terms() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="text-gray-700 leading-7">
        This sample is for coursework and demos only and does not constitute legal advice.
        Review by legal counsel is required before production use.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Acceptance</h2>
        <p className="text-gray-700 leading-7">
          By accessing CourtConnect you agree to these Terms and related policies, including our Privacy Policy.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Accounts & Eligibility</h2>
        <p className="text-gray-700 leading-7">
          Provide accurate information and keep it updated. Some features require email verification.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Roles & Access Control</h2>
        <p className="text-gray-700 leading-7">
          Different roles (player, manager, admin) have different permissions. Attempting to bypass access controls is prohibited.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Bookings</h2>
        <ul className="list-disc pl-6 text-gray-700 leading-7 space-y-1">
          <li>One-hour timeslots with real-time availability.</li>
          <li>Platform may limit concurrent active bookings per account.</li>
          <li>Cancellations allowed ≥ 2 hours before start time unless stated otherwise.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Payments</h2>
        <ul className="list-disc pl-6 text-gray-700 leading-7 space-y-1">
          <li>Processed by third-party providers; no card number/CVV stored by us.</li>
          <li>Prices, taxes, fees are shown at checkout.</li>
          <li>Idempotency is used to avoid duplicate charges.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Venue & Manager Duties</h2>
        <p className="text-gray-700 leading-7">
          Managers must ensure accurate information, comply with laws, and maintain operations.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">7. User Conduct</h2>
        <p className="text-gray-700 leading-7">
          Do not post unlawful or infringing content, scrape data, or attempt to interfere with the service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">8. IP Rights</h2>
        <p className="text-gray-700 leading-7">
          Except for user content, platform materials are owned by CourtConnect or licensors.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">9. Disclaimers & Liability</h2>
        <p className="text-gray-700 leading-7">
          To the extent permitted by law, we are not liable for indirect or incidental damages.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">10. Changes</h2>
        <p className="text-gray-700 leading-7">
          We may update these Terms. Continued use indicates acceptance of the updated Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">11. Contact</h2>
        <p className="text-gray-700 leading-7">legal@courtconnect.example</p>
      </section>
    </div>
  );
}
