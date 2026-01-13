// src/pages/manager/CancellationTemplate.jsx
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, Copy, ArrowLeft } from 'lucide-react';
import { useActiveBookingsSummary } from '../../hooks/useCourtGuards';

function formatAU(dtISO) {
  try { return new Date(dtISO).toLocaleString('en-AU', { hour12: false }); }
  catch { return dtISO; }
}

export default function CancellationTemplate() {
  const { facilityId, courtId } = useParams();
  const { data, isLoading, isError } = useActiveBookingsSummary({ facilityId, courtId });

  const [reason, setReason]   = useState('Maintenance required on playing surface');
  const [refund, setRefund]   = useState('Full refund or free reschedule');
  const [contact, setContact] = useState('support@your-facility.example • (02) 1234 5678');

  // --- Subject/body -------------------------------------------------------
  const subject = useMemo(
    () => `Facility ${facilityId} – Court ${courtId} booking cancelled (${reason})`,
    [facilityId, courtId, reason]
  );

  const bodyFor = (b) => (
`Hi ${b?.userName || 'there'},

We’re sorry—your booking on Court ${courtId} at Facility ${facilityId}
scheduled for ${formatAU(b?.startISO)} (${b?.durationHrs || '?'} hour)
has been cancelled due to: ${reason}.

What you can do:
• Reschedule to another time (subject to availability)
• Or receive a ${refund}

If we don’t hear from you within 48 hours, we’ll process the refund automatically.

Need help? ${contact}

Thanks for your understanding,
Facility ${facilityId} Team`
  );

  // --- Helpers: copy text -------------------------------------------------
  function copy(text) {
    navigator.clipboard?.writeText(text);
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message: 'Copied to clipboard' } }));
  }

  // Build lists
  const bookings = data?.nextBookings || [];
  const emails = bookings.map(b => b.email).filter(Boolean);
  const csv = [
    ['Name','Email','Start (AU)','Duration (h)','Court','Facility'].join(','),
    ...bookings.map(b => [
      b.userName,
      b.email ?? '',
      formatAU(b.startISO),
      b.durationHrs,
      courtId,
      facilityId,
    ].join(',')),
  ].join('\n');

  const sample = bookings[0];

  return (
    <div className="mx-auto max-w-3xl p-6">
          {/* Back links row */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Link
              to={`/manager/facility/${facilityId}/courts`}
              className="px-3 py-2 rounded-xl border hover:bg-gray-50"
            >
              ← Back to Courts
            </Link>
            <Link
              to={`/manager/facility/${facilityId}/courts/${courtId}/delete`}
              className="px-3 py-2 rounded-xl border hover:bg-gray-50"
            >
              Back to Delete
            </Link>
          </div>

          {/* Title + subtitle */}
          <h1 className="text-2xl font-semibold">Cancellation Notification Template</h1>
          <p className="text-sm text-gray-600 mb-6">
            Generate email/message content for users affected by this court cancellation.
          </p>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Reason</label>
          <input className="rounded-xl border px-3 py-2" value={reason} onChange={(e)=>setReason(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Refund / Make-good</label>
          <input className="rounded-xl border px-3 py-2" value={refund} onChange={(e)=>setRefund(e.target.value)} />
        </div>
        <div className="flex flex-col md:col-span-2">
          <label className="text-sm font-medium mb-1">Contact (signature)</label>
          <input className="rounded-xl border px-3 py-2" value={contact} onChange={(e)=>setContact(e.target.value)} />
        </div>
      </div>

      {/* Bulk copy actions */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          className="px-3 py-2 rounded-xl border hover:bg-gray-50 text-sm flex items-center gap-2"
          onClick={()=>copy(subject)}
        >
          <Copy size={14}/> Copy subject
        </button>
        <button
          className="px-3 py-2 rounded-xl border hover:bg-gray-50 text-sm flex items-center gap-2"
          onClick={()=>copy(sample ? bodyFor(sample) : bodyFor({}))}
        >
          <Copy size={14}/> Copy sample body
        </button>
        <button
          className="px-3 py-2 rounded-xl border hover:bg-gray-50 text-sm flex items-center gap-2"
          onClick={()=>copy(emails.join(', '))}
          disabled={emails.length === 0}
          title={emails.length ? '' : 'No emails available'}
        >
          <Copy size={14}/> Copy all emails
        </button>
        <button
          className="px-3 py-2 rounded-xl border hover:bg-gray-50 text-sm flex items-center gap-2"
          onClick={()=>copy(csv)}
          disabled={bookings.length === 0}
          title={bookings.length ? '' : 'No bookings available'}
        >
          <Copy size={14}/> Copy CSV (Name, Email, Time…)
        </button>
      </div>

      {/* Preview */}
      <div className="rounded-2xl border bg-white shadow-sm p-4">
        <div className="font-medium mb-2">Preview</div>
        {isLoading ? (
          <div className="text-gray-600 flex items-center gap-2"><Loader2 className="animate-spin" size={18}/> Loading bookings…</div>
        ) : isError ? (
          <div className="text-red-600 text-sm">Failed to load bookings.</div>
        ) : (
          <>
            <div className="text-sm mb-2"><span className="font-medium">Subject:</span> {subject}</div>
            <pre className="whitespace-pre-wrap text-sm text-gray-800 border rounded-lg p-3 bg-gray-50">{bodyFor(sample)}</pre>

            {/* Affected users list */}
            {bookings.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">
                  Affected users ({bookings.length}):
                </div>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  {bookings.map(b => (
                    <li key={b.id}>
                      {b.userName}
                      {b.email && <> &lt;<span className="text-gray-600">{b.email}</span>&gt;</>}
                      {' — '}{formatAU(b.startISO)} ({b.durationHrs}h)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Tip: paste the copied content into your email tool. When backend emails are ready, this page can directly trigger sends.
      </p>
    </div>
  );
}
