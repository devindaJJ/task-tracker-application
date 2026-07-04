import { Modal } from "./Modal";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isBusy?: boolean;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  isBusy,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p style={{ color: "var(--color-ink-soft)", fontSize: 14, marginBottom: 20 }}>{message}</p>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel} disabled={isBusy}>
          Cancel
        </button>
        <button className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm} disabled={isBusy}>
          {isBusy ? "Deleting…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
