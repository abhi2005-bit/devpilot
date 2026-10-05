import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface SearchResult {
  type: string;
  id: string;
  project_id?: string;
  title: string;
  subtitle?: string;
  url?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      if (query.trim()) {
        fetch(`/api/v1/search?q=${encodeURIComponent(query)}`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
          },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.results) setResults(data.results);
          })
          .catch((err) => console.error(err));
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const handleSelect = (result: SearchResult) => {
    onClose();
    if (result.type === "project") navigate(`/projects/${result.project_id}`);
    else if (result.type === "issue") navigate(`/projects/${result.project_id}/issues/${result.id}`);
    else if (result.type === "goal") navigate(`/projects/${result.project_id}/goals/${result.id}`);
    else if (result.type === "milestone") navigate(`/projects/${result.project_id}/goals`);
    else if (result.type === "sprint") navigate(`/projects/${result.project_id}`);
    else if (result.type === "pr" && result.url) window.open(result.url, "_blank");
    else if (result.type === "commit" && result.url) window.open(result.url, "_blank");
    else navigate(`/projects/${result.project_id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-24 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl bg-surface p-md shadow-2xl">
        <div className="flex items-center border-b border-outline-variant pb-sm">
          <span className="material-symbols-outlined mr-sm text-on-surface-variant">search</span>
          <input
            autoFocus
            type="text"
            placeholder="Search projects, issues, goals..."
            className="w-full bg-transparent font-body-lg text-on-surface outline-none placeholder:text-on-surface-variant"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="mt-sm max-h-[60vh] overflow-y-auto">
          {query.trim() === "" ? (
            <div className="p-md text-center text-on-surface-variant">Search DevPilot...</div>
          ) : results.length === 0 ? (
            <div className="p-md text-center text-on-surface-variant">No results found</div>
          ) : (
            <div className="flex flex-col gap-xs">
              {results.map((r, i) => (
                <button
                  key={`${r.type}-${r.id}-${i}`}
                  onClick={() => handleSelect(r)}
                  className="flex flex-col items-start rounded-lg p-sm hover:bg-surface-container-highest"
                >
                  <div className="flex items-center gap-xs">
                    <span className="text-xs font-bold uppercase text-primary">{r.type}</span>
                    <span className="font-body-md text-on-surface">{r.title}</span>
                  </div>
                  {r.subtitle && <span className="text-sm text-on-surface-variant">{r.subtitle}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
