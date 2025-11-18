import * as Dialog from "@radix-ui/react-dialog";
import { IoMdClose } from "react-icons/io";
import { ReactNode } from "react";

interface ModalProps {
  trigger?: ReactNode;
  title?: string;
  description?: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  contentClassName?: string;
}

export function Modal({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
  className,
  contentClassName,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[9998] data-[state=open]:animate-overlay-show data-[state=closed]:animate-overlay-hide" />
        <Dialog.Content
          className={`fixed left-[50%] top-[50%] z-[9999] w-[90vw] max-w-[600px] max-h-[85vh] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg data-[state=open]:animate-content-show data-[state=closed]:animate-content-hide overflow-y-auto ${contentClassName}`}
        >
          {title && (
            <Dialog.Title className="text-xl font-semibold text-gray-900 mb-4">
              {title}
            </Dialog.Title>
          )}
          {description && (
            <Dialog.Description className="text-sm text-gray-600 mb-4">
              {description}
            </Dialog.Description>
          )}

          <div className={className}>{children}</div>

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-full p-1.5 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#115740] focus:ring-offset-2 transition-colors"
              aria-label="Close"
            >
              <IoMdClose className="h-5 w-5" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default Modal;
