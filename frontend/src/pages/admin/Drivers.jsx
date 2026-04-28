import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPendingDrivers, approveDriver } from '../../api/adminApi';
import Button from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const { showToast } = useToast();

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await getPendingDrivers();
      setDrivers(res.data || []);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to fetch pending drivers', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleApprove = async (id) => {
    setApprovingId(id);
    try {
      await approveDriver(id);
      showToast('Driver approved', { type: 'success' });
      setDrivers((d) => d.filter((x) => x.id !== id));
    } catch (err) {
      showToast(err?.response?.data?.message || 'Approve failed', { type: 'error' });
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950">Pending Drivers</h2>
            <p className="mt-2 text-sm text-slate-500">Review incoming driver applications and approve eligible fleet partners.</p>
          </div>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:bg-brand-500 hover:text-white"
          >
            Back to dashboard
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-medium text-slate-500 shadow-sm">
          Loading pending drivers...
        </div>
      ) : drivers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
          No pending drivers.
        </div>
      ) : (
        <div className="space-y-4">
          {drivers.map((d) => (
            <div
              key={d.id}
              className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="text-2xl font-bold tracking-tight text-slate-950">{d.name}</div>
                <div className="mt-1 text-base text-slate-600">
                  {d.email} <span className="text-slate-300">&bull;</span> {d.phone}
                </div>
                <div className="mt-2 text-sm text-slate-500">Requested: {new Date(d.createdAt).toLocaleString()}</div>
              </div>

              <div className="sm:shrink-0">
                <Button
                  variant="primary"
                  loading={approvingId === d.id}
                  onClick={() => handleApprove(d.id)}
                  className="min-w-[150px] rounded-2xl px-6 py-3 shadow-[0_16px_30px_rgba(255,107,44,0.18)]"
                >
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
