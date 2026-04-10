import React from 'react';

const PagePlaceholder = ({ name }: { name: string }) => (
  <div className="flex flex-col gap-6">
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-slate-900">{name}</h1>
    </div>
    <div className="card p-12 flex items-center justify-center text-slate-400 border-dashed border-2 bg-slate-50/50">
      <p className="text-lg">{name} page is under construction</p>
    </div>
  </div>
);

export const Dashboard = () => <PagePlaceholder name="Dashboard" />;
export const Products = () => <PagePlaceholder name="Products" />;
export const Categories = () => <PagePlaceholder name="Categories" />;
export const Orders = () => <PagePlaceholder name="Orders" />;
export const Notifications = () => <PagePlaceholder name="Notifications" />;
