import { useRef, useState } from "react";
import Modal from "../../components/common/Modal";

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const allowedExtensions = ["pdf", "docx", "txt", "md"];

function formatFileSize(bytes: number) {
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 1,
  )} ${units[index]}`;
}

function getExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function getDocumentIcon(type: string) {
  switch (type) {
    case "pdf":
      return "picture_as_pdf";

    case "docx":
      return "description";

    case "txt":
      return "article";

    case "md":
      return "code";

    default:
      return "draft";
  }
}

function Documents() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openUploadModal = () => {
    setSelectedFile(null);
    setError("");
    setIsUploadOpen(true);
  };

  const closeUploadModal = () => {
    setSelectedFile(null);
    setError("");
    setIsUploadOpen(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) {
      return;
    }

    setError("");

    const extension = getExtension(file.name);

    if (!allowedExtensions.includes(extension)) {
      setSelectedFile(null);
      setError(
        "Unsupported file type. Please upload PDF, DOCX, TXT, or Markdown files.",
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setError("File size must be 10 MB or less.");
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    handleFile(event.target.files?.[0]);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setError("Please select a document first.");
      return;
    }

    const extension = getExtension(selectedFile.name);

    const newDocument: DocumentItem = {
      id: crypto.randomUUID(),
      name: selectedFile.name,
      type: extension,
      size: selectedFile.size,
      uploadedAt: new Date().toISOString(),
    };

    setDocuments((currentDocuments) => [
      newDocument,
      ...currentDocuments,
    ]);

    closeUploadModal();
  };

  const handleDelete = (documentId: string) => {
    setDocuments((currentDocuments) =>
      currentDocuments.filter(
        (document) => document.id !== documentId,
      ),
    );
  };

  return (
    <>
      <div className="w-full px-margin pb-margin pt-8">
        <div className="w-full space-y-lg">

          {/* ================================= */}
          {/* HEADER */}
          {/* ================================= */}

          <section className="flex w-full items-center justify-between gap-lg">

            <div className="flex items-center gap-sm">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container">
                <span className="material-symbols-outlined text-primary">
                  description
                </span>
              </div>

              <div>
                <h1 className="text-title-lg font-bold text-on-surface">
                  Documents
                </h1>

                <p className="mt-xs text-body-sm text-on-surface-variant">
                  Manage and organize your engineering documentation.
                </p>
              </div>

            </div>

            {documents.length > 0 && (
              <button
                type="button"
                onClick={openUploadModal}
                className="flex shrink-0 items-center gap-sm rounded-lg bg-primary px-lg py-sm text-body-sm font-bold text-on-primary transition-colors hover:bg-primary-container"
              >
                <span className="material-symbols-outlined">
                  upload_file
                </span>

                Upload Document
              </button>
            )}

          </section>

          {/* ================================= */}
          {/* EMPTY STATE */}
          {/* ================================= */}

          {documents.length === 0 ? (

            <section className="w-full rounded-xl border border-outline-variant bg-surface-container p-xl">

              <div className="flex min-h-96 w-full flex-col items-center justify-center text-center">

                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-container-high">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant">
                    folder_open
                  </span>
                </div>

                <h2 className="mt-lg text-title-md font-semibold text-on-surface">
                  No documents yet
                </h2>

                <p
                  className="mt-sm text-body-sm leading-6 text-on-surface-variant"
                  style={{
                    width: "100%",
                    maxWidth: "720px",
                  }}
                >
                  Upload project documentation, architecture notes,
                  specifications, technical designs, API references,
                  and other engineering resources.
                </p>

                <button
                  type="button"
                  onClick={openUploadModal}
                  className="mt-lg flex items-center gap-sm rounded-lg bg-primary px-lg py-sm text-body-sm font-bold text-on-primary transition-colors hover:bg-primary-container"
                >
                  <span className="material-symbols-outlined">
                    upload_file
                  </span>

                  Upload Document
                </button>

              </div>

            </section>

          ) : (

            /* ================================= */
            /* DOCUMENT LIST */
            /* ================================= */

            <section className="w-full rounded-xl border border-outline-variant bg-surface-container">

              {/* List Header */}

              <div className="flex items-center justify-between border-b border-outline-variant px-lg py-md">

                <div>
                  <h2 className="font-bold text-on-surface">
                    Project Documents
                  </h2>

                  <p className="mt-xs text-body-sm text-on-surface-variant">
                    {documents.length}{" "}
                    {documents.length === 1
                      ? "document"
                      : "documents"}
                  </p>
                </div>

              </div>

              {/* Documents */}

              <div className="divide-y divide-outline-variant">

                {documents.map((document) => (

                  <div
                    key={document.id}
                    className="flex items-center justify-between gap-lg px-lg py-md transition-colors hover:bg-surface-container-high"
                  >

                    {/* Document Info */}

                    <div className="flex min-w-0 items-center gap-md">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-container-highest">
                        <span className="material-symbols-outlined text-primary">
                          {getDocumentIcon(document.type)}
                        </span>
                      </div>

                      <div className="min-w-0">

                        <p className="truncate font-bold text-on-surface">
                          {document.name}
                        </p>

                        <div className="mt-xs flex flex-wrap items-center gap-sm text-body-sm text-on-surface-variant">

                          <span className="uppercase">
                            {document.type}
                          </span>

                          <span>•</span>

                          <span>
                            {formatFileSize(document.size)}
                          </span>

                          <span>•</span>

                          <span>
                            {new Date(
                              document.uploadedAt,
                            ).toLocaleString()}
                          </span>

                        </div>

                      </div>

                    </div>

                    {/* Actions */}

                    <div className="flex shrink-0 items-center gap-xs">

                      <button
                        type="button"
                        title="Delete document"
                        aria-label={`Delete ${document.name}`}
                        onClick={() =>
                          handleDelete(document.id)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-error"
                      >
                        <span className="material-symbols-outlined">
                          delete
                        </span>
                      </button>

                    </div>

                  </div>

                ))}

              </div>

            </section>

          )}

        </div>
      </div>

      {/* ================================= */}
      {/* UPLOAD MODAL */}
      {/* ================================= */}

      <Modal
        isOpen={isUploadOpen}
        onClose={closeUploadModal}
        title="Upload Document"
      >

        <div className="space-y-lg">

          {/* Upload Area */}

          <div>
            <p className="mb-sm text-body-sm font-bold text-on-surface">
              Document
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="flex min-h-48 w-full flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface px-lg py-xl text-center transition-colors hover:border-primary hover:bg-surface-container-high"
            >

              <span className="material-symbols-outlined text-4xl text-primary">
                cloud_upload
              </span>

              <p className="mt-md font-bold text-on-surface">
                Choose a document
              </p>

              <p className="mt-xs text-body-sm text-on-surface-variant">
                PDF, DOCX, TXT or Markdown
              </p>

              <p className="mt-xs text-body-sm text-on-surface-variant">
                Maximum file size: 10 MB
              </p>

            </button>

          </div>

          {/* Selected File */}

          {selectedFile && (

            <div className="flex items-center justify-between gap-md rounded-lg border border-outline-variant bg-surface-container-high p-md">

              <div className="flex min-w-0 items-center gap-md">

                <span className="material-symbols-outlined shrink-0 text-primary">
                  {getDocumentIcon(
                    getExtension(selectedFile.name),
                  )}
                </span>

                <div className="min-w-0">

                  <p className="truncate font-bold text-on-surface">
                    {selectedFile.name}
                  </p>

                  <p className="mt-xs text-body-sm text-on-surface-variant">
                    {formatFileSize(selectedFile.size)}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);

                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"
                aria-label="Remove selected file"
              >
                <span className="material-symbols-outlined">
                  close
                </span>
              </button>

            </div>

          )}

          {/* Error */}

          {error && (
            <div className="flex items-start gap-sm rounded-lg border border-error p-md text-error">

              <span className="material-symbols-outlined">
                error
              </span>

              <p className="text-body-sm">
                {error}
              </p>

            </div>
          )}

          {/* Actions */}

          <div className="flex justify-end gap-sm border-t border-outline-variant pt-lg">

            <button
              type="button"
              onClick={closeUploadModal}
              className="rounded-lg border border-outline-variant px-lg py-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile}
              className="flex items-center gap-sm rounded-lg bg-primary px-lg py-sm font-bold text-on-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined">
                upload
              </span>

              Upload
            </button>

          </div>

        </div>

      </Modal>
    </>
  );
}

export default Documents;