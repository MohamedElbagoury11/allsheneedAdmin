import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';

const StatsCard = ({ title, value, icon: Icon, trend, loading }: any) => (
  <div className="card p-6 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <div className="p-3 bg-slate-50 rounded-xl text-primary">
        <Icon size={24} />
      </div>
      {trend && (
        <span className={`flex items-center gap-1 text-sm font-medium ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      {loading ? (
        <div className="h-8 w-24 bg-slate-100 animate-pulse rounded mt-1" />
      ) : (
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      )}
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('7d');

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['admin-summary'],
    queryFn: () => api.get('/admin/analytics/summary').then(res => res.data),
  });

  const { data: revenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: ['admin-revenue', period],
    queryFn: () => api.get(`/admin/analytics/revenue?period=${period}`).then(res => res.data),
  });

  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['admin-orders', period],
    queryFn: () => api.get(`/admin/analytics/orders?period=${period}`).then(res => res.data),
  });

  const { data: topProducts, isLoading: loadingTopProducts } = useQuery({
    queryKey: ['admin-top-products'],
    queryFn: () => api.get('/admin/analytics/top-products?limit=5').then(res => res.data),
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Real-time overview of your store performance</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200">
          {['7d', '30d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                period === p ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Revenue" 
          value={formatCurrency(summary?.totalRevenue || 0)} 
          icon={TrendingUp} 
          trend={summary?.revenueTrend}
          loading={loadingSummary}
        />
        <StatsCard 
          title="Total Orders" 
          value={summary?.totalOrders || 0} 
          icon={ShoppingCart} 
          trend={summary?.ordersTrend}
          loading={loadingSummary}
        />
        <StatsCard 
          title="Total Products" 
          value={summary?.totalProducts || 0} 
          icon={Package} 
          loading={loadingSummary}
        />
        <StatsCard 
          title="Total Users" 
          value={summary?.totalUsers || 0} 
          icon={Users} 
          loading={loadingSummary}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Revenue Over Time</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => [formatCurrency(val), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Orders Volume</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => [val, 'Orders']}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Top Selling Products</h3>
            <button onClick={() => navigate('/products')} className="text-primary text-sm font-semibold hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Product</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Sales</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProducts?.map((product: any) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={product.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                        <span className="font-medium text-slate-700">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600">{product.totalSold} units</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-slate-900">{formatCurrency(product.revenue)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Quick Actions</h3>
          </div>
          <div className="p-6 space-y-3">
            <button onClick={() => navigate('/products', { state: { openAddModal: true } })} className="btn btn-outline w-full justify-start gap-3 py-3 border-dashed">
              <Package size={20} className="text-slate-400" />
              <span>Add New Product</span>
            </button>
            <button onClick={() => navigate('/orders')} className="btn btn-outline w-full justify-start gap-3 py-3 border-dashed">
              <ShoppingCart size={20} className="text-slate-400" />
              <span>View Latest Orders</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
