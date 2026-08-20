import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

function Modal({
  isOpen,
  onClose,
  title,
  children,
}: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={onClose}
    >
      <div
        className="relative w-[min(90vw,32rem)] max-h-[90vh] overflow-y-auto rounded-xl border border-outline-variant bg-surface-container p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2
            id="modal-title"
            className="text-xl font-bold text-on-surface"
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            <span className="material-symbols-outlined">
              close
            </span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
