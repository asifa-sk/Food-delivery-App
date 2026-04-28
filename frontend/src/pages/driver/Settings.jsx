import { useState } from 'react';
import DriverSidebar from '../../components/driver/DriverSidebar';
import DriverTopbar from '../../components/driver/DriverTopbar';
import { readStoredJson } from '../../utils/storage';

export default function DriverSettings() {
  const driver = readStoredJson('driver', {});
  const [form, setForm] = useState({
    name: driver.name || '',
    email: driver.email || '',
    phone: driver.phone || '',
    vehiclePlate: driver.vehicle?.plate || driver.vehiclePlate || '',
    receiveSms: true,
    isAvailable: true,
  });

  const handleChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    // persist locally for now; backend integration can be added
    const updated = { ...driver, name: form.name, email: form.email, phone: form.phone, vehicle: { plate: form.vehiclePlate } };
    localStorage.setItem('driver', JSON.stringify(updated));
    alert('Settings saved locally');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DriverSidebar />
      <div className="flex-1 md:ml-0">
        <DriverTopbar driverName={driver?.name || 'Driver'} />
        <div className="mx-auto max-w-6xl p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Settings</h1>
            <p className="mt-2 text-sm text-slate-500">Update your driver profile, vehicle details, and delivery preferences.</p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
            <h3 className="text-2xl font-black tracking-tight text-slate-950">Profile</h3>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Full Name</label>
                <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-brand-400" value={form.name} onChange={e => handleChange('name', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Email</label>
                <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-brand-400" value={form.email} onChange={e => handleChange('email', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Phone</label>
                <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-brand-400" value={form.phone} onChange={e => handleChange('phone', e.target.value)} />
              </div>
            </div>

            <h3 className="mt-8 text-2xl font-black tracking-tight text-slate-950">Vehicle</h3>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-[1.4fr_0.8fr]">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Vehicle Plate</label>
                <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-brand-400" value={form.vehiclePlate} onChange={e => handleChange('vehiclePlate', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Availability</label>
                <div className="mt-2 flex items-center gap-3">
                  <button onClick={() => handleChange('isAvailable', true)} className={`rounded-2xl px-4 py-3 font-semibold transition ${form.isAvailable ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Available</button>
                  <button onClick={() => handleChange('isAvailable', false)} className={`rounded-2xl px-4 py-3 font-semibold transition ${!form.isAvailable ? 'bg-brand-500 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Unavailable</button>
                </div>
              </div>
            </div>

            <h3 className="mt-8 text-2xl font-black tracking-tight text-slate-950">Preferences</h3>
            <div className="mt-4 flex items-center gap-4 rounded-2xl bg-slate-50 px-4 py-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.receiveSms} onChange={e => handleChange('receiveSms', e.target.checked)} />
                <span className="text-sm font-medium text-slate-700">Receive SMS updates</span>
              </label>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button onClick={handleSave} className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-600">Save changes</button>
              <button onClick={() => { setForm({ name: driver.name || '', email: driver.email || '', phone: driver.phone || '', vehiclePlate: driver.vehicle?.plate || '', receiveSms: true, isAvailable: true }); }} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">Reset</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
