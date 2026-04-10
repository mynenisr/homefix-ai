'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import { createBrowserClient } from '@/lib/supabase';

const CATEGORIES = ['PLUMBING','ELECTRICAL','HVAC','APPLIANCE','ROOFING','PEST_CONTROL','LOCKSMITH','GENERAL'];

export default function NewCase() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ description: '', address: '', category: '' });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Photo must be under 10MB');
      return;
    }
    setPhotoFile(file);
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function uploadPhoto(userId: string): Promise<string | null> {
    if (!photoFile) return null;
    setUploadProgress('Uploading photo…');
    const ext = photoFile.name.split('.').pop() ?? 'jpg';
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('case-photos')
      .upload(path, photoFile, { contentType: photoFile.type, upsert: false });
    if (error) throw new Error(`Photo upload failed: ${error.message}`);
    const { data } = supabase.storage.from('case-photos').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) return;
    setLoading(true);
    setError('');

    try {
      // Get current user for storage path
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload photo first if present
      const photoUrl = await uploadPhoto(user.id);
      setUploadProgress('');

      setUploadProgress('Analyzing with AI…');
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          photoUrls: photoUrl ? [photoUrl] : [],
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { id } = await res.json();
      router.push(`/cases/${id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      setUploadProgress('');
    }
  }

  return (
    <>
      <Nav />
      <main className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-6">Submit a New Issue</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Describe the issue *</label>
            <textarea
              required
              rows={4}
              placeholder="e.g. Kitchen faucet has been dripping for 2 days, getting worse..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Property address</label>
            <input
              type="text"
              placeholder="123 Main St, City, State"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category (optional — AI will detect)</label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Auto-detect</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Photo <span className="text-gray-400 font-normal">(optional — helps AI diagnose faster)</span>
            </label>
            {!photoPreview ? (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <span className="text-2xl mb-1">📷</span>
                <span className="text-sm text-gray-500">Click to attach a photo</span>
                <span className="text-xs text-gray-400 mt-0.5">JPG, PNG, HEIC up to 10MB</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            ) : (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Issue preview"
                  className="w-full h-40 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 bg-white rounded-full w-7 h-7 flex items-center justify-center text-gray-500 hover:text-red-500 shadow text-sm font-bold"
                >
                  ✕
                </button>
                <p className="text-xs text-gray-500 mt-1 truncate">{photoFile?.name}</p>
              </div>
            )}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (uploadProgress || 'Submitting…') : 'Submit & Triage'}
          </button>
        </form>
      </main>
    </>
  );
}
