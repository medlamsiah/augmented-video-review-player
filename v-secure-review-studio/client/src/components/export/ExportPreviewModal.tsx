import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "../ui/Button";

type ExportPreviewModalProps = {
  open: boolean;
  payload: unknown;
  onClose: () => void;
  onDownload: () => void;
};

export function ExportPreviewModal({ open, payload, onClose, onDownload }: ExportPreviewModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="export-modal" initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 12 }}>
            <div className="modal-header">
              <div>
                <span>Export JSON</span>
                <strong>v-secure-review-export.json</strong>
              </div>
              <Button variant="ghost" icon={<X size={16} />} onClick={onClose} aria-label="Fermer" />
            </div>
            <pre>{JSON.stringify(payload, null, 2)}</pre>
            <div className="modal-actions">
              <Button variant="secondary" onClick={onClose}>
                Fermer
              </Button>
              <Button variant="primary" onClick={onDownload}>
                Telecharger JSON
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
