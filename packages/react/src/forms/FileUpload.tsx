import { Upload } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { DropZone, type DropZoneProps, FileTrigger, isFileDropItem, Text } from "react-aria-components";
import { Button } from "../actions/Button";
import { cx } from "../utils/cx";

/** A file the app is holding: chosen, uploading (progress 0–100) or uploaded. */
export type FileUploadEntry = { id: string; name: string; size: number; progress?: number };

const UNITS = ["byte", "kilobyte", "megabyte", "gigabyte"] as const;

/** A file size in decimal units, as the reader's locale writes them: "820 kB", "1.2 MB". */
export function formatFileSize(bytes: number, locale?: string): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < UNITS.length - 1) {
    value /= 1000;
    unit++;
  }
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: UNITS[unit],
    unitDisplay: "short",
    maximumFractionDigits: unit === 0 ? 0 : 1,
  }).format(value);
}

/** Whether a file matches an accept list of MIME types ("image/png"), wildcards ("image/*") or extensions (".pdf"). */
export function acceptsFile(file: { name: string; type: string }, accepted: readonly string[] | undefined): boolean {
  if (!accepted || accepted.length === 0) return true;
  const name = file.name.toLowerCase();
  return accepted.some((rule) => {
    const r = rule.trim().toLowerCase();
    if (r.startsWith(".")) return name.endsWith(r);
    if (r.endsWith("/*")) return file.type.toLowerCase().startsWith(r.slice(0, -1));
    return file.type.toLowerCase() === r;
  });
}

export type FileUploadProps = {
  /** Names the Choose files button and the list of files. */
  label: ReactNode;
  /** The limits, such as "PDF or PNG, up to 10 MB."; describes the Choose files button. */
  description?: ReactNode;
  /** MIME types, wildcards or extensions, as for the accept attribute. */
  acceptedFileTypes?: string[];
  allowsMultiple?: boolean;
  /** Largest accepted file, in bytes. */
  maxSize?: number;
  /** The files to list. The app owns them: add on onAdd, remove on onRemove, set progress while uploading. */
  files: FileUploadEntry[];
  /** Called with the accepted files, from the button or a drop. */
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  /** Defaults to "Choose files". */
  buttonLabel?: string;
  /** Defaults to "Drop files here, or". */
  dropLabel?: string;
  /** Shown while files are dragged over. Defaults to "Drop to add". */
  dropActiveLabel?: string;
  className?: string;
};

/**
 * A drop zone with a Choose files button, and the list of chosen files with size, Remove and
 * optional upload progress. Refused files are reported in an alert. Removing a file moves focus to
 * the next Remove button, or to Choose files when none is left.
 * Native twin: <input type="file" class="sw-file-input">, which is itself the drop zone.
 */
export function FileUpload({
  label,
  description,
  acceptedFileTypes,
  allowsMultiple = false,
  maxSize,
  files,
  onAdd,
  onRemove,
  buttonLabel = "Choose files",
  dropLabel = "Drop files here, or",
  dropActiveLabel = "Drop to add",
  className,
}: FileUploadProps) {
  const labelId = useId();
  const descriptionId = useId();
  const buttonId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  /** The row a Remove was pressed on, and how many files there were then. */
  const removal = useRef<{ index: number; count: number } | null>(null);
  /** Each add gets its own alert (keyed by id), so a repeated refusal is announced again. */
  const [problems, setProblems] = useState<{ id: number; items: string[] }>({ id: 0, items: [] });

  const add = (chosen: File[]) => {
    const accepted: File[] = [];
    const refused: string[] = [];
    for (const file of chosen) {
      if (!acceptsFile(file, acceptedFileTypes)) refused.push(`${file.name} is not an accepted type.`);
      else if (maxSize != null && file.size > maxSize) refused.push(`${file.name} is larger than ${formatFileSize(maxSize)}.`);
      else accepted.push(file);
    }
    if (!allowsMultiple) {
      for (const extra of accepted.splice(1)) refused.push(`${extra.name} was not added: only one file is allowed.`);
    }
    setProblems((previous) => ({ id: previous.id + 1, items: refused }));
    if (accepted.length > 0) onAdd(accepted);
  };

  const onDrop: DropZoneProps["onDrop"] = async (event) => {
    add(await Promise.all(event.items.filter(isFileDropItem).map((item) => item.getFile())));
  };

  // After a removal, keep keyboard users in place: the next Remove button, else Choose files.
  // Only when the list really got shorter: an ignored Remove followed by a progress tick moves nothing.
  useEffect(() => {
    const pending = removal.current;
    if (pending == null) return;
    removal.current = null;
    if (files.length >= pending.count) return;
    const buttons = listRef.current?.querySelectorAll<HTMLElement>(".sw-file-remove") ?? [];
    const target = buttons[Math.min(pending.index, buttons.length - 1)] ?? document.getElementById(buttonId);
    target?.focus();
  }, [files, buttonId]);

  return (
    <div className={cx("sw-field sw-file-upload", className)}>
      <span className="sw-field-label" id={labelId}>
        {label}
      </span>
      <DropZone className="sw-file-drop" onDrop={onDrop}>
        {({ isDropTarget }) => (
          <>
            <Upload aria-hidden="true" />
            <Text slot="label" className="sw-file-drop-text">
              {isDropTarget ? dropActiveLabel : dropLabel}
            </Text>
            <FileTrigger
              acceptedFileTypes={acceptedFileTypes}
              allowsMultiple={allowsMultiple}
              onSelect={(list) => add(Array.from(list ?? []))}
            >
              <Button
                id={buttonId}
                aria-labelledby={`${buttonId} ${labelId}`}
                aria-describedby={description != null ? descriptionId : undefined}
              >
                {buttonLabel}
              </Button>
            </FileTrigger>
          </>
        )}
      </DropZone>
      {description != null && (
        <span className="sw-field-description" id={descriptionId}>
          {description}
        </span>
      )}
      {problems.items.length > 0 && (
        <div key={problems.id} className="sw-field-error" role="alert">
          {problems.items.map((problem, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: two refused files may share a name.
            <p key={`${index}-${problem}`}>{problem}</p>
          ))}
        </div>
      )}
      {files.length > 0 && (
        <ul ref={listRef} className="sw-file-list" aria-labelledby={labelId}>
          {files.map((file, index) => {
            const uploading = file.progress != null && file.progress < 100;
            return (
              <li key={file.id} className="sw-file-item">
                <div className="sw-file-meta">
                  <span className="sw-file-name">{file.name}</span>
                  <span className="sw-file-size">
                    {formatFileSize(file.size)}
                    {uploading ? ` · ${Math.round(file.progress ?? 0)}%` : ""}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  className="sw-file-remove"
                  aria-label={`Remove ${file.name}`}
                  onPress={() => {
                    removal.current = { index, count: files.length };
                    onRemove(file.id);
                  }}
                >
                  Remove
                </Button>
                {uploading && (
                  <progress
                    className="sw-progress-bar"
                    value={file.progress}
                    max={100}
                    aria-label={`Uploading ${file.name}`}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
