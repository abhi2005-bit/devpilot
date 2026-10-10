import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Modal from "../../components/common/Modal";
import CreateDocumentForm from "../../components/documents/CreateDocumentForm";
import DocumentCard from "../../components/documents/DocumentCard";
import { documentService, type DocumentItem, type DocumentCreate } from "../../services/documentService";
import { errorMessage } from "../../services/apiClient";

const CATEGORIES = ["All Docs", "Architecture", "API Docs", "Guides", "Meeting Notes"];

export default function Documents() {
  const { projectId } = useParams<{ projectId: string }>();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Docs");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadDocuments() {
      if (!projectId) return;
      setIsLoading(true);
      try {
        const docs = await documentService.getProjectDocuments(projectId);
        if (!cancelled) {
          setDocuments(docs);
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(errorMessage(loadError, "Failed to load documents."));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadDocuments();
    return () => { cancelled = true; };
  }, [projectId, reloadKey]);

  const displayedDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesCategory = activeCategory === "All Docs" || doc.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        doc.title.toLowerCase().includes(q) || 
        (doc.description && doc.description.toLowerCase().includes(q)) ||
        doc.category.toLowerCase().includes(q);
      
      return matchesCategory && matchesSearch;
    });
  }, [documents, activeCategory, searchQuery]);

  const handleCreateDocument = async (data: DocumentCreate) => {
    if (!projectId) return;
    try {
      const newDoc = await documentService.createDocument(projectId, data);
      setDocuments(prev => [newDoc, ...prev]);
      setIsCreateModalOpen(false);
    } catch (createError) {
      setError(errorMessage(createError, "Failed to create document."));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-xl">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1400px] space-y-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
        <h2 className="font-display-lg text-display-lg text-on-surface">Documentation</h2>
        <div className="flex items-center gap-sm">
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation..." 
              className="w-full bg-surface border border-outline-variant rounded pl-xl pr-sm py-sm text-on-surface focus:border-primary focus:ring-0 font-body-md text-body-md placeholder:text-on-surface-variant"
            />
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary-container text-on-primary-container font-title-sm text-title-sm rounded px-md py-sm flex items-center gap-xs whitespace-nowrap hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Document
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex flex-col gap-md rounded-lg border border-error/30 bg-error-container p-md text-error sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 break-words text-body-sm">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="w-fit shrink-0 rounded-lg border border-error/30 px-md py-sm text-body-sm font-semibold hover:bg-error/10"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex items-center gap-sm border-b border-outline-variant pb-xs overflow-x-auto hide-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-md py-xs font-title-sm text-title-sm whitespace-nowrap transition-colors ${
              activeCategory === cat 
                ? "text-secondary border-b-2 border-secondary" 
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {!error && (displayedDocuments.length === 0 ? (
        <div className="flex min-h-[300px] w-full min-w-0 items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-lg sm:p-xl">
          <div className="flex w-full min-w-0 flex-col items-center text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-md">description</span>
            {documents.length === 0 ? (
              <>
                <h2 className="text-title-md font-semibold text-on-surface">No documents yet</h2>
                <p className="mb-lg mt-sm w-full max-w-2xl text-pretty text-body-sm text-on-surface-variant">
                  Create your first project document to capture architecture, APIs, guides, and team knowledge.
                </p>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="min-h-10 shrink-0 rounded-lg bg-primary-container px-md py-sm font-medium text-on-primary-container"
                >
                  New Document
                </button>
              </>
            ) : (
              <>
                <h2 className="text-title-md font-semibold text-on-surface">No results</h2>
                <p className="mt-sm w-full max-w-2xl text-pretty text-body-sm text-on-surface-variant">
                  No {activeCategory !== "All Docs" ? activeCategory : ""} documents match your search.
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid w-full min-w-0 grid-cols-1 gap-md md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedDocuments.map(doc => (
            <DocumentCard key={doc.id} document={doc} projectId={projectId!} />
          ))}
        </div>
      ))}

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Document">
        <CreateDocumentForm onSubmit={handleCreateDocument} onCancel={() => setIsCreateModalOpen(false)} />
      </Modal>
    </div>
  );
}
