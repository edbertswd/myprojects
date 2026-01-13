import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">About Us</h1>
        <p className="mt-3 text-gray-700 leading-7">
          CourtConnect makes booking sports facilities simple, reliable, and transparent.
          Players discover and reserve courts in minutes; managers publish availability
          and run operations efficiently; admins oversee system health and compliance.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Our Mission</h2>
        <p className="text-gray-700 leading-7">
          Bring all scattered booking systems into one unified platform—so anyone can
          find the right venue, at the right time, with zero friction.
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold">Unified Search & Booking</h3>
          <p className="mt-2 text-gray-700 text-sm leading-6">
            Filter by sport, location, date, and price. Availability is displayed in
            one-hour slots with real-time status and double-booking protection.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold">Secure & Compliant</h3>
          <p className="mt-2 text-gray-700 text-sm leading-6">
            Email verification (24-hour link), rate-limits (5 failed logins/hour),
            optional MFA, audit logs, and tokenized payments—no card number/CVV stored.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold">Role-Based Experience</h3>
          <p className="mt-2 text-gray-700 text-sm leading-6">
            Players book and manage orders; managers publish slots and view utilization;
            admins approve venues and monitor the system.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">How It Works</h2>
        <ol className="list-decimal pl-6 space-y-2 text-gray-700 leading-7">
          <li>Search for a venue and pick a one-hour timeslot.</li>
          <li>Checkout via secure third-party payment.</li>
          <li>Receive confirmation and enjoy your game.</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Values</h2>
        <ul className="list-disc pl-6 space-y-1 text-gray-700 leading-7">
          <li>Reliability & Transparency</li>
          <li>User-centric Design</li>
          <li>Privacy & Security First</li>
          <li>Auditability & Accountability</li>
        </ul>
      </section>

      <div className="pt-2">
        <Link
          to="/facilities"
          className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
        >
          Browse Facilities
        </Link>
      </div>
    </div>
  );
}
