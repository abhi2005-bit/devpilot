import { Link } from "react-router-dom";
import type { DocumentItem } from "../../services/documentService";

interface DocumentCardProps {
  document: DocumentItem;
  projectId: string | number;
}

const CATEGORY_STYLES: Record<string, { icon: string; colorClass: string }> = {
  "Architecture": { icon: "architecture", colorClass: "text-secondary" },
  "API Docs": { icon: "api", colorClass: "text-primary" },
  "Guides": { icon: "menu_book", colorClass: "text-tertiary" },
  "Meeting Notes": { icon: "forum", colorClass: "text-on-surface-variant" },
};

export default function DocumentCard({ document, projectId }: DocumentCardProps) {
  const style = CATEGORY_STYLES[document.category] || CATEGORY_STYLES["Guides"];

  return (
    <Link
      to={`/projects/${projectId}/documents/${document.id}`}
      className="group bg-surface-container-low border border-outline-variant rounded-lg p-md flex flex-col gap-sm hover:border-primary-container transition-colors relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-sm opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="material-symbols-outlined text-outline-variant text-[18px]">open_in_new</span>
      </div>

      <div className={`flex items-center gap-xs mb-xs ${style.colorClass}`}>
        <span className="material-symbols-outlined text-[20px]">{style.icon}</span>
        <span className="font-code-label text-code-label uppercase tracking-wider">{document.category}</span>
      </div>

      <h3 className="font-title-sm text-title-sm text-on-surface line-clamp-1">{document.title}</h3>
      
      <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 flex-1">
        {document.description || "No description provided."}
      </p>

      <div className="flex items-center justify-between mt-sm pt-sm border-t border-outline-variant">
        <div className="flex items-center gap-xs">
          <div className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center text-caption text-on-surface">
            {document.author_id ? "U" : "?"}
          </div>
          <span className="font-body-sm text-body-sm text-on-surface">Author {document.author_id || "Unknown"}</span>
        </div>
        <span className="font-caption text-caption text-outline">
          {new Date(document.updated_at).toLocaleDateString()}
        </span>
      </div>
    </Link>
  );
}
