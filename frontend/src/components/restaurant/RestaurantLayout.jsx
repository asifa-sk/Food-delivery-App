import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { RESTAURANT_NAV_ITEMS } from './restaurantNav';

export default function RestaurantLayout({ title, subtitle, children, rightBadge }) {
  const location = useLocation();

  return (
    <div className="app-shell px-4 py-4 md:px-6 md:py-6">
      <div className="relative mx-auto max-w-7xl space-y-6">
        <section className="panel-dark overflow-hidden p-6 md:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top,rgba(255,231,204,0.28),transparent_62%)] md:block" />
          <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-start">
            <div>
              <div className="hero-badge border-white/30 bg-white/10 text-white">
                <Sparkles size={12} />
                {title || 'Restaurant workspace'}
              </div>
              <h1 className="mt-4 whitespace-pre-line text-3xl font-black tracking-tight text-white md:text-5xl">
                {subtitle || 'Manage your restaurant'}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-100 md:text-base">
                A consistent operating view for your menu, customers, reviews and business updates.
              </p>
            </div>

            <div className="flex flex-wrap items-start justify-start gap-3 md:justify-end">
              {rightBadge ? (
                <div className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                  {rightBadge}
                </div>
              ) : null}
              <Link
                to="/restaurant/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-lg shadow-brand-500/10 transition hover:bg-brand-50"
              >
                <ArrowLeft size={16} />
                Back to dashboard
              </Link>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          {RESTAURANT_NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-brand-500 hover:bg-brand-500 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
