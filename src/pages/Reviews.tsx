import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { formatDate, cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { CheckCircle, Clock, Loader2, MessageSquare, Search, ShieldCheck, Star, Trash2 } from 'lucide-react';

const statusConfig: any = {
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Pending' },
  approved: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Approved' },
};

const Reviews = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin-reviews', filterStatus],
    queryFn: () => api.get('/reviews', { 
      params: { 
        status: filterStatus === 'all' ? undefined : filterStatus 
      } 
    }).then(res => res.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/reviews/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review approved successfully');
    },
    onError: () => toast.error('Failed to approve review'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/reviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review deleted successfully');
    },
    onError: () => toast.error('Failed to delete review'),
  });

  const filteredReviews = reviews?.filter((r: any) => 
    r.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.comment?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Reviews Management</h1>
        <p className="text-slate-500 mt-1">Moderate customer reviews and product feedback</p>
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by customer, product, or comment..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex overflow-x-auto gap-2 w-full md:w-auto">
            {['all', 'pending', 'approved'].map((status) => (
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
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Product</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Rating</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Comment</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReviews?.length > 0 ? (
                filteredReviews.map((review: any) => {
                  const status = review.isApproved ? 'approved' : 'pending';
                  const config = statusConfig[status];
                  const StatusIcon = config.icon;
                  
                  return (
                    <tr key={review.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                            {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span className="font-medium text-slate-900">{review.user?.name || 'Unknown User'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 line-clamp-1 max-w-[150px]" title={review.product?.name}>
                          {review.product?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-yellow-400 gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={14} 
                              fill={i < review.rating ? "currentColor" : "none"} 
                              strokeWidth={i < review.rating ? 0 : 2} 
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2 max-w-[300px]">
                          <MessageSquare size={16} className="text-slate-300 mt-1 shrink-0" />
                          <p className="text-sm text-slate-600 line-clamp-2 italic">"{review.comment}"</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "flex items-center w-fit gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          config.bg,
                          config.color
                        )}>
                          <StatusIcon size={12} />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!review.isApproved && (
                            <button 
                              onClick={() => approveMutation.mutate(review.id)}
                              disabled={approveMutation.isPending}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Approve Review"
                            >
                              <ShieldCheck size={18} />
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this review?')) {
                                deleteMutation.mutate(review.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete Review"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No reviews found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
