import { IconButton, Tooltip, TooltipTrigger } from "@raster/react";
import { Copy } from "lucide-react";

export default function IconHint() {
  return (
    <TooltipTrigger>
      <IconButton label="Duplicate">
        <Copy aria-hidden="true" strokeWidth={1.5} />
      </IconButton>
      <Tooltip>Duplicate (D)</Tooltip>
    </TooltipTrigger>
  );
}
