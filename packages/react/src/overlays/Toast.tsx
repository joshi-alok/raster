import { CircleCheck, Info, OctagonExclamationPoint, TriangleExclamationPoint, X } from "lucide-react";
import {
  Text,
  UNSTABLE_Toast as AriaToast,
  UNSTABLE_ToastContent as AriaToastContent,
  UNSTABLE_ToastQueue as AriaToastQueue,
  UNSTABLE_ToastRegion as AriaToastRegion,
} from "react-aria-components";
import { IconButton } from "../actions/IconButton";
import { cx } from "../utils/cx";

export type ToastTone = "info" | "success" | "warning" | "danger";

export type ToastContent = {
  title: string;
  description?: string;
  tone?: ToastTone;
};

export type ToastQueue = AriaToastQueue<ToastContent>;

/** Create a queue; call queue.add({ title, … }, { timeout }) to show a toast. */
export function createToastQueue(maxVisibleToasts = 5): ToastQueue {
  return new AriaToastQueue<ToastContent>({ maxVisibleToasts });
}

/** A shared app-wide queue for the common case of one ToastRegion. */
export const toastQueue: ToastQueue = createToastQueue();

const ICONS = {
  info: Info,
  success: CircleCheck,
  warning: TriangleExclamationPoint,
  danger: OctagonExclamationPoint,
} as const;

export type ToastRegionProps = {
  queue?: ToastQueue;
  className?: string;
};

/** Render once near the app root; shows toasts added to its queue. */
export function ToastRegion({ queue = toastQueue, className }: ToastRegionProps) {
  return (
    <AriaToastRegion queue={queue} className={cx("sw-toast-region", className)}>
      {({ toast }) => {
        const tone = toast.content.tone ?? "info";
        const Icon = ICONS[tone];
        return (
          <AriaToast toast={toast} className="sw-toast" data-tone={tone}>
            <Icon className="sw-toast-icon" aria-hidden="true" />
            <AriaToastContent className="sw-toast-content">
              <Text slot="title" className="sw-toast-title">
                {toast.content.title}
              </Text>
              {toast.content.description && (
                <Text slot="description" className="sw-toast-description">
                  {toast.content.description}
                </Text>
              )}
            </AriaToastContent>
            <IconButton slot="close" label="Dismiss" variant="ghost">
              <X />
            </IconButton>
          </AriaToast>
        );
      }}
    </AriaToastRegion>
  );
}
