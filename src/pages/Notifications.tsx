// Removed unused React import
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, Clock, ShoppingCart, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { cn } from '../lib/utils';
// Removed unused toast import

const Notifications = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => api.get('/admin/analytics/notifications').then(res => res.data),
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const readMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  const handleNotificationClick = (n: any) => {
    // Mark as read
    if (!n.read) {
      readMutation.mutate(n.id);
    }

    // If it's an order notification, extract order ID and navigate
    if (n.type === 'order' && n.message) {
      // Extract UUID from the message (e.g. "A new order abc-123-... for $100 has been placed.")
      const uuidMatch = n.message.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      if (uuidMatch) {
        navigate(`/orders?orderId=${uuidMatch[0]}`);
        return;
      }
    }
  };

  if (isLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">Stay updated with store activity</p>
        </div>
        <div className="px-4 py-2 bg-slate-100 rounded-xl text-slate-600 text-sm font-medium">
          {notifications?.filter((n: any) => !n.read).length || 0} Unread
        </div>
      </div>

      <div className="space-y-4">
        {notifications?.length === 0 ? (
          <div className="card p-12 flex flex-col items-center justify-center text-slate-400">
            <Bell size={48} className="text-slate-200 mb-4" />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications?.map((n: any) => (
            <div 
              key={n.id} 
              className={cn(
                "card p-5 flex gap-4 transition-all hover:shadow-md cursor-pointer",
                !n.read && "border-l-4 border-l-primary bg-primary/5 shadow-sm"
              )}
              onClick={() => handleNotificationClick(n)}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                n.type === 'order' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
              )}>
                {n.type === 'order' ? <ShoppingCart size={24} /> : <Bell size={24} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-bold text-slate-900">{n.title}</h3>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-600 mt-1">{n.message}</p>
                <div className="flex items-center gap-3 mt-2">
                  {!n.read && (
                    <button 
                      className="text-primary text-xs font-bold hover:underline"
                      onClick={(e) => { e.stopPropagation(); readMutation.mutate(n.id); }}
                    >
                      Mark as read
                    </button>
                  )}
                  {n.type === 'order' && (
                    <span className="text-xs text-slate-400">Click to view order →</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;

