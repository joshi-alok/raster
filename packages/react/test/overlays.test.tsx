import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "../src/actions/Button";
import { Dialog, DialogTrigger } from "../src/overlays/Dialog";
import { expectAccessible } from "./axe";
import { Select, SelectItem } from "../src/forms/Select";
import { ThemeRegion } from "../src/overlays/ThemeRegion";

describe("ThemeRegion", () => {
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

  it("has no structural violations when open", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Delete file" }));
    await expectAccessible((await screen.findByRole("dialog")).closest(".sw-modal-overlay")!);
  });
});
