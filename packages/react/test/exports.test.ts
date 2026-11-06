import { describe, expect, it } from "vitest";
import * as raster from "../src";

describe("public API", () => {
  it("exports every Plan 2a component", () => {
    const expected = [
      "Container", "Section", "Stack", "Grid", "Col", "Rule",
      "Heading", "Text", "Eyebrow", "Figure",
      "Button", "IconButton", "Link",
      "Card", "Tag", "Callout", "Table",
      "FieldLabel", "FieldDescription", "FieldError",
      "TextField", "TextArea", "Checkbox", "Switch", "RadioGroup", "Radio", "Select", "SelectItem",
      "ThemeRegion", "Dialog", "DialogTrigger", "Menu", "MenuItem", "MenuSeparator", "MenuTrigger",
      "Tooltip", "TooltipTrigger", "ToastRegion", "createToastQueue",
      "Breadcrumbs", "Breadcrumb", "Tabs", "TabList", "Tab", "TabPanel", "Header", "Reveal",
      "Accordion", "Disclosure",
      "Popover", "Drawer",
      "Pagination", "paginationItems",
      "SideNav", "SideNavGroup", "SideNavLink",
      "TagGroup", "Chip",
      "SegmentedControl", "Segment",
      "SearchField",
      "NumberField",
      "Slider",
      "ProgressBar", "Meter", "meterState", "meterRegion",
      "Banner", "Skeleton", "EmptyState", "Media", "Avatar", "initials", "Badge", "DescriptionList", "DescriptionItem", "Stat",
      "ComboBox", "ComboBoxItem", "Calendar", "RangeCalendar",
      "DatePicker", "DateRangePicker",
      "FileUpload", "formatFileSize", "acceptsFile",
      "DataGrid", "DataGridHeader", "DataGridColumn", "DataGridBody", "DataGridRow", "DataGridCell",
      "cx",
    ];
    for (const name of expected) expect(typeof (raster as Record<string, unknown>)[name], name).toBe("function");
  });

  it("exports a shared toast queue", () => {
    expect(typeof (raster as Record<string, unknown>).toastQueue).toBe("object");
  });

  it("does not export the old Label name", () => {
    expect("Label" in raster).toBe(false);
  });
});
