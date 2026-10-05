import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  project_id?: number;
  entity_id?: string;
  entity_type?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();

  const fetchNotifications = () => {
    fetch("/api/v1/notifications", {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token") || ""}` }
    })
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkRead = (id: number) => {
    fetch(`/api/v1/notifications/${id}/read`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token") || ""}` }
    }).then(() => fetchNotifications());
  };

  const handleMarkAllRead = () => {
    fetch("/api/v1/notifications/read-all", {
      method: "POST",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token") || ""}` }
    }).then(() => fetchNotifications());
  };

  const handleSelect = (n: Notification) => {
    if (!n.is_read) handleMarkRead(n.id);
    onClose();
    if (n.project_id) {
      if (n.entity_type === "issue" && n.entity_id) {
        navigate(`/projects/${n.project_id}/issues/${n.entity_id}`);
      } else {
        navigate(`/projects/${n.project_id}`);
      }
    }
  };

  return (
    <div className="absolute right-0 top-11 z-50 w-80 rounded-lg border border-outline-variant bg-surface-container-high p-md shadow-lg">
      <div className="flex items-center justify-between border-b border-outline-variant pb-sm mb-sm">
        <h3 className="font-bold text-on-surface">Notifications</h3>
        <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
      </div>
      
      <div className="flex flex-col gap-xs max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-sm text-center text-on-surface-variant">No new notifications</div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`flex flex-col rounded p-sm cursor-pointer hover:bg-surface-container-highest ${n.is_read ? 'opacity-60' : 'bg-surface-container'}`} onClick={() => handleSelect(n)}>
              <div className="flex justify-between items-start">
                <span className="font-bold text-sm text-on-surface">{n.title}</span>
                {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary mt-1"></span>}
              </div>
              <span className="text-sm text-on-surface-variant mt-1">{n.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
