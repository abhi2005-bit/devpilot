import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notificationService, type Notification } from "../../services/notificationService";
import { errorMessage } from "../../services/apiClient";

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    notificationService.list()
      .then((data) => {
        if (cancelled) return;
        setNotifications(data);
        setError("");
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(errorMessage(loadError, "Failed to load notifications."));
      });

    return () => { cancelled = true; };
  }, [isOpen, retryKey]);

  if (!isOpen) return null;

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markRead(id);
      setNotifications(await notificationService.list());
      setError("");
    } catch (readError) {
      setError(errorMessage(readError, "Failed to mark notification as read."));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(await notificationService.list());
      setError("");
    } catch (readError) {
      setError(errorMessage(readError, "Failed to mark notifications as read."));
    }
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

      {error && (
        <div role="alert" className="mb-sm rounded-md border border-error/30 bg-error-container p-sm text-sm text-error">
          <p>{error}</p>
          <button type="button" onClick={() => setRetryKey((key) => key + 1)} className="mt-xs font-semibold underline">
            Retry
          </button>
        </div>
      )}
      
      <div className="flex flex-col gap-xs max-h-96 overflow-y-auto">
        {!error && notifications.length === 0 ? (
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
