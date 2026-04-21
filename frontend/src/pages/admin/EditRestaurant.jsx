import { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';

const API = 'http://localhost:8081/api';

export default function EditRestaurantPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({ name: '', address: '', contactNumber: '', imageUrl: '', latitude: '', longitude: '' });
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch(`${API}/restaurants/${id}`)
      .then(r => r.json())
      .then(data => {
        setForm({
          name: data.name || '',
          address: data.address || '',
          contactNumber: data.contactNumber || '',
          imageUrl: data.imageUrl || '',
          latitude: data.latitude ?? '',
          longitude: data.longitude ?? '',
        });
        setImagePreview(data.imageUrl || '');
      })
      .catch(() => setError('Failed to load restaurant details.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setForm({ ...form, imageUrl: url });
    setImagePreview(url);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API}/upload/image`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setForm(prev => ({ ...prev, imageUrl: data.url }));
      setImagePreview(data.url);
    } catch (err) {
      setError('Image upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.name || !form.address || !form.contactNumber) {
      setError('Name, address and contact number are required.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name,
        address: form.address,
        contactNumber: form.contactNumber,
        imageUrl: form.imageUrl || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      };
      const res = await fetch(`${API}/restaurants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update');
      setSuccess('Restaurant updated successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const textFields = [
    { name: 'name', label: 'Restaurant Name', required: true },
    { name: 'address', label: 'Address', required: true },
    { name: 'contactNumber', label: 'Contact Number', required: true },
    { name: 'latitude', label: 'Latitude', required: false },
    { name: 'longitude', label: 'Longitude', required: false },
  ];

  return (
    <AdminLayout title="Edit Restaurant">
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/admin/restaurants')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            ← Back to Restaurants
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Edit Restaurant</h2>
          <p className="text-gray-500 mb-6 text-sm">Update the restaurant profile details below.</p>

          {loading ? (
            <div className="py-12 text-center text-gray-400">
              <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading...
            </div>
          ) : (
            <>
              {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}
              {success && (
                <div className="mb-4 rounded-xl bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm flex justify-between items-center">
                  {success}
                  <button onClick={() => navigate('/admin/restaurants')} className="ml-4 underline text-green-800 font-medium">View all →</button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {textFields.map(f => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {f.label} {f.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      name={f.name}
                      value={form[f.name]}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 focus:bg-white transition"
                    />
                  </div>
                ))}

                {/* Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Image</label>
                  {imagePreview && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-gray-200 h-48 bg-gray-100">
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" onError={() => setImagePreview('')} />
                    </div>
                  )}
                  <div
                    className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2 text-orange-500">
                        <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-2xl mb-1">📷</p>
                        <p className="text-sm font-medium text-gray-700">Click to change image</p>
                        <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP up to 10MB</p>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </div>
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 font-medium">OR paste URL</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <input
                    name="imageUrl"
                    value={form.imageUrl}
                    onChange={handleImageUrlChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 focus:bg-white transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="w-full mt-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 transition disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
