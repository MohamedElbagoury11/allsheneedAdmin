import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, Eye, CheckCircle, Clock, Truck, XCircle, Loader2, Minus, Plus, Printer } from 'lucide-react';
import api from '../lib/api';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const statusConfig: any = {
  processing: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Processing' },
  shipped: { icon: Truck, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-100', label: 'Cancelled' },
};

const Orders = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Order #${selectedOrder.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; color: #1e293b; }
            h3 { font-size: 22px; margin-bottom: 4px; }
            .subtitle { font-size: 12px; color: #64748b; font-family: monospace; margin-bottom: 24px; }
            .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1e293b; margin-bottom: 8px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
            .info-box { background: #f8fafc; padding: 16px; border-radius: 10px; }
            .info-box p { font-size: 13px; color: #64748b; margin: 2px 0; }
            .info-box .name { font-weight: 700; color: #1e293b; }
            .status { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 10px; font-weight: 700; text-transform: uppercase; background: #fef3c7; color: #d97706; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
            th { background: #f8fafc; font-size: 10px; font-weight: 600; text-transform: uppercase; color: #64748b; padding: 10px 12px; text-align: left; }
            td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
            .text-right { text-align: right; }
            .bold { font-weight: 700; }
            .total-row td { background: #f8fafc; font-weight: 700; font-size: 15px; }
            .total-value { color: #6366f1; }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>
          <h3>Order Details</h3>
          <p class="subtitle">#${selectedOrder.id}</p>
          <div class="info-grid">
            <div>
              <p class="section-title">Customer Info</p>
              <div class="info-box">
                <p class="name">${selectedOrder.customerName}</p>
                <p>Order Date: ${formatDate(selectedOrder.date)}</p>
                <span class="status">${selectedOrder.status}</span>
              </div>
            </div>
            <div>
              <p class="section-title">Shipping Address</p>
              <div class="info-box">
                <p class="name">${selectedOrder.shipping?.firstName || ''} ${selectedOrder.shipping?.lastName || ''}</p>
                <p>${selectedOrder.shipping?.address || ''}</p>
                <p>${selectedOrder.shipping?.city || ''}, ${selectedOrder.shipping?.state || ''} ${selectedOrder.shipping?.zipCode || ''}</p>
              </div>
            </div>
          </div>
          <p class="section-title">Order Items</p>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Qty</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(selectedOrder.items || []).map((item: any) => `
                <tr>
                  <td class="bold">${item.name || 'Unknown'}</td>
                  <td>${item.categoryName || 'N/A'}</td>
                  <td>${formatCurrency(item.price || 0)}</td>
                  <td>${item.quantity || 0}</td>
                  <td class="text-right bold">${formatCurrency((item.price || 0) * (item.quantity || 0))}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="4" class="text-right">Total Order Value:</td>
                <td class="text-right total-value">${formatCurrency(selectedOrder.total)}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => api.get('/admin/analytics/all-orders').then(res => res.data),
  });

  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-open order from URL query param (e.g. from notification click)
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId && orders) {
      const order = orders.find((o: any) => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        // Clean up URL
        searchParams.delete('orderId');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [orders, searchParams]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => 
      api.patch(`/admin/analytics/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated');
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ orderId, productId }: { orderId: string, productId: string }) => 
      api.delete(`/admin/analytics/orders/${orderId}/items/${productId}`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setSelectedOrder(data.data); // Update modal data
      toast.success('Item removed from order');
    },
    onError: () => toast.error('Failed to remove item'),
  });
  
  const updateQuantityMutation = useMutation({
    mutationFn: ({ orderId, productId, quantity }: { orderId: string, productId: string, quantity: number }) => 
      api.patch(`/admin/analytics/orders/${orderId}/items/${productId}`, { quantity }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setSelectedOrder(data.data); // Update modal data
      toast.success('Quantity updated');
    },
    onError: () => toast.error('Failed to update quantity'),
  });

  const filteredOrders = orders?.filter((o: any) => 
    (filterStatus === 'all' || o.status === filterStatus) &&
    (o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     o.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
        <p className="text-slate-500 mt-1">Manage customer orders and fulfillment</p>
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by customer or order ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex overflow-x-auto gap-2 w-full md:w-auto">
            {['all', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  filterStatus === status ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Order ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Total</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders?.map((order: any) => {
                const StatusIcon = statusConfig[order.status]?.icon || Clock;
                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">#{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-slate-600">{order.customerName}</td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(order.date)}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(order.total)}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "flex items-center w-fit gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                        statusConfig[order.status]?.bg,
                        statusConfig[order.status]?.color
                      )}>
                        <StatusIcon size={14} />
                        {statusConfig[order.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <select 
                          className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-1 outline-none focus:ring-2 focus:ring-primary/20"
                          value={order.status}
                          onChange={(e) => statusMutation.mutate({ id: order.id, status: e.target.value })}
                          disabled={statusMutation.isPending}
                        >
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div ref={printRef} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Order Details</h3>
                <p className="text-sm text-slate-500 font-mono mt-0.5">#{selectedOrder.id} ({selectedOrder.itemsCount || 0} items)</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
              {/* Customer & Shipping */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Customer Info</h4>
                  <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                    <p className="font-bold text-slate-900">{selectedOrder.customerName}</p>
                    <p className="text-sm text-slate-500">Order Date: {formatDate(selectedOrder.date)}</p>
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      statusConfig[selectedOrder.status]?.bg,
                      statusConfig[selectedOrder.status]?.color
                    )}>
                      {selectedOrder.status}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Shipping Address</h4>
                  <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 space-y-1">
                    <p className="font-bold text-slate-900">{selectedOrder.shipping?.firstName} {selectedOrder.shipping?.lastName}</p>
                    <p>{selectedOrder.shipping?.address}</p>
                    <p>{selectedOrder.shipping?.city}, {selectedOrder.shipping?.state} {selectedOrder.shipping?.zipCode}</p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Order Items</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                      <tr>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Qty</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item: any) => (
                          <tr key={item.productId || Math.random()} className="text-sm">
                            <td className="px-4 py-3 font-medium text-slate-900">{item.name || 'Unknown Product'}</td>
                            <td className="px-4 py-3 text-slate-500">{item.categoryName || 'N/A'}</td>
                            <td className="px-4 py-3 text-slate-600">{formatCurrency(item.price || 0)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => updateQuantityMutation.mutate({ orderId: selectedOrder.id, productId: item.productId, quantity: Math.max(1, (item.quantity || 1) - 1) })}
                                  disabled={(item.quantity || 1) <= 1 || updateQuantityMutation.isPending}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-8 text-center font-bold">{item.quantity || 0}</span>
                                <button 
                                  onClick={() => updateQuantityMutation.mutate({ orderId: selectedOrder.id, productId: item.productId, quantity: (item.quantity || 0) + 1 })}
                                  disabled={updateQuantityMutation.isPending}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-500"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency((item.price || 0) * (item.quantity || 0))}</td>
                            <td className="px-4 py-3 text-right">
                              <button 
                                onClick={() => deleteItemMutation.mutate({ orderId: selectedOrder.id, productId: item.productId })}
                                disabled={deleteItemMutation.isPending || selectedOrder.items.length <= 1}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-all disabled:opacity-30"
                                title="Cancel Item"
                              >
                                <XCircle size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No items in this order</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold text-slate-900">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-right">Total Order Value:</td>
                        <td className="px-4 py-3 text-right text-lg text-primary">{formatCurrency(selectedOrder.total)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={handlePrint}
                className="btn btn-outline flex items-center gap-2 px-6"
              >
                <Printer size={18} />
                Print
              </button>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="btn btn-primary px-8"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
