import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { documentService, type DocumentItem, type DocumentUpdate } from "../../services/documentService";

export default function DocumentDetail() {
  const { projectId, documentId } = useParams<{ projectId: string; documentId: string }>();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<DocumentUpdate>({});

  useEffect(() => {
    let cancelled = false;
    async function loadDocument() {
      if (!projectId || !documentId) return;
      setIsLoading(true);
      try {
        const doc = await documentService.getDocument(projectId, documentId);
        if (!cancelled) {
          setDocument(doc);
          setEditForm({
            title: doc.title,
            description: doc.description || "",
            category: doc.category,
            content: doc.content || "",
          });
        }
      } catch {
        if (!cancelled) setError("Failed to load document.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadDocument();
    return () => { cancelled = true; };
  }, [projectId, documentId]);

  const handleUpdate = async () => {
    if (!projectId || !documentId) return;
    try {
      const updated = await documentService.updateDocument(projectId, documentId, editForm);
      setDocument(updated);
      setIsEditing(false);
    } catch {
      alert("Failed to update document.");
    }
  };

  const handleDelete = async () => {
    if (!projectId || !documentId) return;
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await documentService.deleteDocument(projectId, documentId);
      navigate(`/projects/${projectId}/documents`);
    } catch {
      alert("Failed to delete document.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-xl">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="text-center p-xl">
        <h2 className="text-error mb-sm">{error || "Document not found"}</h2>
        <Link to={`/projects/${projectId}/documents`} className="text-primary hover:underline">
          Back to Documents
        </Link>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="max-w-[1000px] w-full mx-auto space-y-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-display-sm text-on-surface">Edit Document</h2>
          <div className="flex gap-sm">
            <button onClick={() => setIsEditing(false)} className="px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded">
              Cancel
            </button>
            <button onClick={handleUpdate} className="px-md py-sm bg-primary text-on-primary rounded font-medium">
              Save Changes
            </button>
          </div>
        </div>

        <div className="space-y-md bg-surface-container-low p-lg rounded-xl border border-outline-variant">
          <div>
            <label className="block text-sm font-medium mb-xs">Title</label>
            <input 
              className="w-full bg-surface border border-outline-variant rounded px-sm py-sm text-on-surface focus:border-primary focus:ring-0"
              value={editForm.title} onChange={e => setEditForm(p => ({...p, title: e.target.value}))} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-xs">Category</label>
            <select 
              className="w-full bg-surface border border-outline-variant rounded px-sm py-sm text-on-surface focus:border-primary focus:ring-0"
              value={editForm.category} onChange={e => setEditForm(p => ({...p, category: e.target.value}))}
            >
              <option value="Architecture">Architecture</option>
              <option value="API Docs">API Docs</option>
              <option value="Guides">Guides</option>
              <option value="Meeting Notes">Meeting Notes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-xs">Description</label>
            <textarea 
              rows={2}
              className="w-full bg-surface border border-outline-variant rounded px-sm py-sm text-on-surface focus:border-primary focus:ring-0"
              value={editForm.description} onChange={e => setEditForm(p => ({...p, description: e.target.value}))} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-xs">Content (Markdown)</label>
            <textarea 
              rows={15}
              className="w-full font-mono bg-surface border border-outline-variant rounded px-sm py-sm text-on-surface focus:border-primary focus:ring-0"
              value={editForm.content} onChange={e => setEditForm(p => ({...p, content: e.target.value}))} 
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] w-full mx-auto space-y-lg">
      <Link to={`/projects/${projectId}/documents`} className="inline-flex items-center gap-xs text-on-surface-variant hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Documents
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-sm mb-sm text-on-surface-variant text-sm font-medium uppercase tracking-wider">
            <span>{document.category}</span>
          </div>
          <h1 className="text-display-md font-bold text-on-surface">{document.title}</h1>
          <p className="text-body-lg text-on-surface-variant mt-sm max-w-2xl">{document.description}</p>
        </div>
        
        <div className="flex items-center gap-sm">
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-xs px-md py-sm bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit
          </button>
          <button onClick={handleDelete} className="flex items-center gap-xs px-md py-sm text-error hover:bg-error-container rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[18px]">delete</span>
            Delete
          </button>
        </div>
      </div>

      <div className="flex items-center gap-lg border-y border-outline-variant py-sm text-sm text-on-surface-variant">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-[18px]">person</span>
          Author: {document.author_id || "Unknown"}
        </div>
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-[18px]">calendar_today</span>
          Updated: {new Date(document.updated_at).toLocaleString()}
        </div>
      </div>

      <div className="prose prose-invert max-w-none text-on-surface bg-surface-container-low p-lg rounded-xl border border-outline-variant">
        {document.content ? (
          <div className="whitespace-pre-wrap">{document.content}</div>
        ) : (
          <p className="text-on-surface-variant italic">No content available.</p>
        )}
      </div>
    </div>
  );
}
