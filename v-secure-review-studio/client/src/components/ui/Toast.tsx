import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

type ToastProps = {
  message: string | null;
};

export function Toast({ message }: ToastProps) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          className="toast"
        >
          <CheckCircle2 size={18} />
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
