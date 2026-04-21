import React from 'react';
import { Link } from 'react-router-dom';

export default function RestaurantLayout({ title, subtitle, children, rightBadge }) {
  return (
    <div className="min-h-screen bg-[#fffaf6] p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-white via-orange-50 to-amber-100 shadow-sm">
          <div className="grid gap-6 p-6 md:grid-cols-[1.5fr_1fr] md:p-8 items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-500">{title || 'Restaurant settings'}</p>
              <h1 className="mt-3 text-3xl font-black text-gray-900 md:text-4xl whitespace-pre-line">{subtitle || ''}</h1>
              <p className="mt-3 max-w-2xl text-sm text-gray-600 md:text-base">Manage basic restaurant information visible to customers.</p>
            </div>

            <div className="flex items-start justify-end gap-3">
              {rightBadge && (
                <div className="rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600">{rightBadge}</div>
              )}
              <Link to="/restaurant/dashboard" className="inline-flex items-center gap-2 rounded-full bg-white/80 hover:bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-md">
                ← Back to dashboard
              </Link>
            </div>
          </div>
        </section>

        <div>{children}</div>
      </div>
    </div>
  );
}
