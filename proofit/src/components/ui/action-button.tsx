"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ActionResult } from "@/lib/types";
import { Button, type ButtonProps } from "./button";
import { useToast } from "./toast";

/**
 * Button that runs a server action, shows a loading state, surfaces the
 * result as a toast and refreshes server data.
 */
export function ActionButton({
  action,
  confirm,
  successTitle,
  onDone,
  children,
  ...rest
}: Omit<ButtonProps, "onClick" | "action"> & {
  action: () => Promise<ActionResult<unknown>>;
  confirm?: string;
  successTitle?: string;
  onDone?: (r: ActionResult<unknown>) => void;
}) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <Button
      {...rest}
      loading={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          try {
            const r = await action();
            if (r.ok) {
              toast({ tone: "success", title: successTitle ?? r.message ?? "Done", text: successTitle ? r.message : undefined });
              router.refresh();
            } else {
              toast({ tone: "error", title: r.error });
            }
            onDone?.(r);
          } catch {
            toast({ tone: "error", title: "Network error", text: "Check your connection and try again." });
          }
        });
      }}
    >
      {children}
    </Button>
  );
}
