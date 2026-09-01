import { MdClose } from "react-icons/md";

export default function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <h3 className="font-semibold text-ink-800">{title}</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700">
            <MdClose size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
