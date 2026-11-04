import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { X } from "lucide-react";
import { Button } from "../src/actions/Button";
import { IconButton } from "../src/actions/IconButton";
import { Dialog, DialogTrigger } from "../src/overlays/Dialog";
import { Menu, MenuItem, MenuSeparator, MenuTrigger } from "../src/overlays/Menu";
import { expectAccessible } from "./axe";
import { Select, SelectItem } from "../src/forms/Select";
import { Tooltip, TooltipTrigger } from "../src/overlays/Tooltip";
import { createToastQueue, ToastRegion } from "../src/overlays/Toast";
import { ThemeRegion } from "../src/overlays/ThemeRegion";

describe("ThemeRegion", () => {
  it("renders an initially open overlay inside the themed host on the first render", async () => {
    render(
      <ThemeRegion theme="zurich">
        <Dialog isOpen title="Already open">
          <p>Body</p>
        </Dialog>
      </ThemeRegion>,
    );
    const dialog = await screen.findByRole("dialog", { name: "Already open" });
    expect(dialog.closest(".sw-portal-host")).not.toBeNull();
    expect(dialog.closest('[data-theme="zurich"]')).not.toBeNull();
  });

  it("removes its host from the body when unmounted", () => {
    const { unmount } = render(<ThemeRegion theme="zurich" />);
    expect(document.body.querySelectorAll(".sw-portal-host")).toHaveLength(1);
    unmount();
    expect(document.body.querySelectorAll(".sw-portal-host")).toHaveLength(0);
  });

  it("sets theme and mode attributes on its element", () => {
    render(
      <ThemeRegion theme="zurich" mode="dark" data-testid="r">
        <p>Inside</p>
      </ThemeRegion>,
    );
    const r = screen.getByTestId("r");
    expect(r).toHaveAttribute("data-theme", "zurich");
    expect(r).toHaveAttribute("data-mode", "dark");
    expect(r).toHaveClass("sw-theme-region");
  });

  it("portals overlays opened inside it into the region, so they inherit its theme", async () => {
    const user = userEvent.setup();
    render(
      <ThemeRegion theme="zurich" mode="dark">
        <Select label="Theme">
          <SelectItem id="a">Alpine</SelectItem>
        </Select>
      </ThemeRegion>,
    );
    await user.click(screen.getByRole("button", { name: /Theme/ }));
    const listbox = await screen.findByRole("listbox");
    expect(listbox.closest('[data-theme="zurich"]')).not.toBeNull();
    expect(listbox.closest(".sw-portal-host")).not.toBeNull();
  });

  it("renders the portal host at the end of document.body, outside the region element", async () => {
    render(
      <ThemeRegion theme="zurich" data-testid="r">
        <p>Inside</p>
      </ThemeRegion>,
    );
    await waitFor(() => expect(document.querySelector(".sw-portal-host")).not.toBeNull());
    const host = document.querySelector(".sw-portal-host")!;
    expect(host.parentElement).toBe(document.body);
    expect(screen.getByTestId("r").contains(host)).toBe(false);
    expect(host).toHaveAttribute("data-theme", "zurich");
  });

  it("nested regions inherit the effective theme and mode on the host", async () => {
    const user = userEvent.setup();
    render(
      <ThemeRegion theme="zurich">
        <ThemeRegion mode="dark">
          <Select label="Theme">
            <SelectItem id="a">Alpine</SelectItem>
          </Select>
        </ThemeRegion>
      </ThemeRegion>,
    );
    await user.click(screen.getByRole("button", { name: /Theme/ }));
    const listbox = await screen.findByRole("listbox");
    const host = listbox.closest(".sw-portal-host")!;
    expect(host).toHaveAttribute("data-theme", "zurich");
    expect(host).toHaveAttribute("data-mode", "dark");
  });

  it("leaves overlays outside any region portalled to the body", async () => {
    const user = userEvent.setup();
    render(
      <Select label="Theme">
        <SelectItem id="a">Alpine</SelectItem>
      </Select>,
    );
    await user.click(screen.getByRole("button", { name: /Theme/ }));
    const listbox = await screen.findByRole("listbox");
    expect(listbox.closest(".sw-portal-host")).toBeNull();
  });
});

describe("Dialog", () => {
  function Example({ dismissable = true }: { dismissable?: boolean }) {
    return (
      <DialogTrigger>
        <Button>Delete file</Button>
        <Dialog title="Delete this file?" isDismissable={dismissable}>
          {({ close }) => (
            <>
              <p>This can't be undone.</p>
              <div className="sw-dialog-actions">
                <Button onPress={close}>Cancel</Button>
                <Button variant="danger" onPress={close}>
                  Delete
                </Button>
              </div>
            </>
          )}
        </Dialog>
      </DialogTrigger>
    );
  }

  it("opens from its trigger, is named by its title, and traps focus inside", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Delete file" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete this file?" });
    expect(dialog).toHaveClass("sw-dialog");
    expect(dialog.closest(".sw-modal")).not.toBeNull();
    expect(dialog.closest(".sw-modal-overlay")).not.toBeNull();
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("closes with Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Delete file" });
    await user.click(trigger);
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("closes from an action via the render-prop close()", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Delete file" }));
    await user.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("can be an alert dialog", async () => {
    const user = userEvent.setup();
    render(
      <DialogTrigger>
        <Button>Open</Button>
        <Dialog title="Session expired" role="alertdialog">
          <p>Sign in again.</p>
        </Dialog>
      </DialogTrigger>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(await screen.findByRole("alertdialog", { name: "Session expired" })).toBeInTheDocument();
  });

  it("does not dismiss an alertdialog on backdrop click", async () => {
    const user = userEvent.setup();
    render(
      <DialogTrigger>
        <Button>Open</Button>
        <Dialog title="Session expired" role="alertdialog">
          <p>Sign in again.</p>
        </Dialog>
      </DialogTrigger>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(dialog.closest(".sw-modal-overlay")!);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("dismisses a regular dialog on backdrop click", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Delete file" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(dialog.closest(".sw-modal-overlay")!);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("can be controlled without a trigger", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog isOpen onOpenChange={onOpenChange} title="Confirm">
        <p>Sure?</p>
      </Dialog>,
    );
    expect(await screen.findByRole("dialog", { name: "Confirm" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("has no structural violations when open", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Delete file" }));
    await expectAccessible((await screen.findByRole("dialog")).closest(".sw-modal-overlay")!);
  });
});

describe("Menu", () => {
  function Example({ onAction }: { onAction?: (key: unknown) => void }) {
    return (
      <MenuTrigger>
        <Button>Actions</Button>
        <Menu onAction={onAction}>
          <MenuItem id="edit">Edit</MenuItem>
          <MenuItem id="duplicate">Duplicate</MenuItem>
          <MenuSeparator />
          <MenuItem id="delete" variant="danger">
            Delete
          </MenuItem>
        </Menu>
      </MenuTrigger>
    );
  }

  it("opens a menu of items from its trigger", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    const menu = await screen.findByRole("menu");
    expect(menu).toHaveClass("sw-menu");
    expect(menu.closest(".sw-popover")).not.toBeNull();
    expect(screen.getAllByRole("menuitem")).toHaveLength(3);
    expect(screen.getByRole("separator")).toHaveClass("sw-menu-separator");
  });

  it("reports the chosen item and closes", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Example onAction={onAction} />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Duplicate" }));
    // RAC 1.22.1 calls onAction(key, undefined), so assert on the key argument.
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction.mock.calls[0][0]).toBe("duplicate");
  });

  it("marks destructive items", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(await screen.findByRole("menuitem", { name: "Delete" })).toHaveAttribute("data-variant", "danger");
  });
});

describe("Tooltip", () => {
  it("appears on keyboard focus and describes its trigger", async () => {
    const user = userEvent.setup();
    render(
      <TooltipTrigger>
        <IconButton label="Close">
          <X />
        </IconButton>
        <Tooltip>Close panel (Esc)</Tooltip>
      </TooltipTrigger>,
    );
    await user.tab();
    const tip = await screen.findByRole("tooltip");
    expect(tip).toHaveClass("sw-tooltip");
    expect(tip).toHaveTextContent("Close panel (Esc)");
    expect(screen.getByRole("button", { name: "Close" })).toHaveAccessibleDescription("Close panel (Esc)");
  });

  it("hides on Escape", async () => {
    const user = userEvent.setup();
    render(
      <TooltipTrigger>
        <IconButton label="Close">
          <X />
        </IconButton>
        <Tooltip>Close panel</Tooltip>
      </TooltipTrigger>,
    );
    await user.tab();
    await screen.findByRole("tooltip");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});

describe("Toast", () => {
  it("shows queued toasts with title, description and tone, and dismisses them", async () => {
    const user = userEvent.setup();
    const queue = createToastQueue();
    render(<ToastRegion queue={queue} />);
    act(() => {
      queue.add({ title: "File saved", description: "All changes synced.", tone: "success" });
    });
    const title = await screen.findByText("File saved");
    const toast = title.closest(".sw-toast")!;
    expect(toast).toHaveAttribute("data-tone", "success");
    expect(screen.getByText("All changes synced.")).toHaveClass("sw-toast-description");
    expect(toast.querySelector(".sw-toast-icon")).toHaveAttribute("aria-hidden", "true");
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("File saved")).toBeNull();
  });

  it("prefixes the title with a visually hidden tone word", async () => {
    const queue = createToastQueue();
    render(<ToastRegion queue={queue} />);
    act(() => {
      queue.add({ title: "Upload failed", tone: "danger" });
    });
    const title = (await screen.findByText("Upload failed")).closest(".sw-toast-title")!;
    const sr = title.querySelector(".sw-sr-only")!;
    expect(sr.tagName).toBe("SPAN");
    expect(sr.textContent).toBe("Error: ");
    expect(title.firstChild).toBe(sr);
  });

  it("names the region for assistive tech", () => {
    const queue = createToastQueue();
    render(<ToastRegion queue={queue} />);
    act(() => {
      queue.add({ title: "Hello" });
    });
    expect(screen.getByRole("region", { name: /notifications?/i })).toHaveClass("sw-toast-region");
  });
});
