'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const POSITIVE_TAGS = ['Professional', 'On time', 'Fixed it right', 'Good communication', 'Clean work', 'Fair price'];
const NEGATIVE_TAGS = ['Late arrival', 'Overpriced', 'Incomplete fix', 'Poor communication', 'Messy work'];

interface FeedbackFormProps {
  caseId: string;
  vendorId?: string;
  vendorName?: string;
}

export default function FeedbackForm({ caseId, vendorId, vendorName }: FeedbackFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  function toggleTag(tag: string) {
    setTags(t => t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag]);
  }

  const allTags = rating >= 4 ? POSITIVE_TAGS : rating > 0 && rating <= 2 ? NEGATIVE_TAGS : [...POSITIVE_TAGS, ...NEGATIVE_TAGS];

  async function submit() {
    if (!rating) { setError('Please select a star rating'); return; }
    setLoading(true);
    setError('');
    const res = await fetch(`/api/cases/${caseId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, tags, comment, vendorId }),
    });
    if (res.ok) {
      setDone(true);
      router.refresh();
    } else {
      const body = await res.json();
      setError(body.error ?? 'Failed to submit');
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
        <p className="text-2xl mb-2">🎉</p>
        <p className="font-semibold text-green-700">Thanks for your feedback!</p>
        <p className="text-sm text-green-600 mt-1">Your rating helps us improve vendor quality.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border-2 border-blue-100">
      <p className="text-sm font-semibold text-blue-700 mb-0.5">How did it go?</p>
      <p className="text-xs text-gray-500 mb-4">
        {vendorName ? `Rate your experience with ${vendorName}` : 'Rate your repair experience'}
      </p>

      {/* Star rating */}
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-3xl transition-transform hover:scale-110 focus:outline-none"
          >
            <span className={(hovered || rating) >= star ? 'text-yellow-400' : 'text-gray-200'}>
              ★
            </span>
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-gray-500 self-center">
            {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
          </span>
        )}
      </div>

      {/* Tags — shown after rating selected */}
      {rating > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">What stood out? (optional)</p>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  tags.includes(tag)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comment */}
      {rating > 0 && (
        <div className="mb-4">
          <textarea
            rows={2}
            placeholder="Any additional comments? (optional)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <button
        onClick={submit}
        disabled={loading || rating === 0}
        className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
      >
        {loading ? 'Submitting…' : 'Submit Feedback'}
      </button>
    </div>
  );
}
