import { useForm } from "react-hook-form";
import type { DocumentCreate } from "../../services/documentService";

interface CreateDocumentFormProps {
  onSubmit: (data: DocumentCreate) => void;
  onCancel: () => void;
}

export default function CreateDocumentForm({ onSubmit, onCancel }: CreateDocumentFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<DocumentCreate>({
    defaultValues: {
      category: "Architecture",
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-on-surface">Title</label>
        <input
          type="text"
          {...register("title", { required: "Title is required" })}
          className="block w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {errors.title && <p className="mt-1 text-xs text-error">{errors.title.message}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-on-surface">Category</label>
        <select
          {...register("category")}
          className="block w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="Architecture">Architecture</option>
          <option value="API Docs">API Docs</option>
          <option value="Guides">Guides</option>
          <option value="Meeting Notes">Meeting Notes</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-on-surface">Description</label>
        <textarea
          rows={3}
          {...register("description")}
          className="block w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-on-surface">Content (Markdown)</label>
        <textarea
          rows={10}
          {...register("content")}
          className="block w-full font-mono rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex justify-end gap-3 border-t border-outline-variant pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-outline-variant px-5 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-on-primary transition-colors hover:bg-primary-container disabled:opacity-50"
        >
          Create Document
        </button>
      </div>
    </form>
  );
}
