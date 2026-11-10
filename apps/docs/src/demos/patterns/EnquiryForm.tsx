import {
  Banner,
  Button,
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  Stack,
  TextArea,
  TextField,
} from "@rasterdesign/react";
import { type FormEvent, useRef, useState } from "react";

type Errors = Partial<Record<"name" | "email", string>>;

/** The form's checks, run on submit: what is wrong, said as what to do. */
export function validate(values: { name: string; email: string }): Errors {
  const errors: Errors = {};
  if (values.name.trim() === "") errors.name = "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter an email address such as name@studio.ch.";
  }
  return errors;
}

const FIELD_IDS = { name: "enquiry-name", email: "enquiry-email" } as const;

export default function EnquiryForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const status = useRef<HTMLDivElement>(null);
  const failed = Object.entries(errors) as [keyof Errors, string][];
  const summaryTitle =
    failed.length === 0
      ? undefined
      : failed.length === 1
        ? "Fix 1 field to send the enquiry"
        : `Fix ${failed.length} fields to send the enquiry`;
  const statusName = summaryTitle ?? (sent ? "Enquiry sent" : undefined);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = validate({ name, email });
    setErrors(next);
    setSent(Object.keys(next).length === 0);
    // After React draws the summary or the confirmation, move focus to it so it is read out. Focus
    // does the announcing, so the Banners drop their live-region roles; both would read it twice.
    requestAnimationFrame(() => status.current?.focus());
  }

  return (
    <form noValidate onSubmit={onSubmit}>
      <Stack gap={5}>
        <div
          ref={status}
          tabIndex={-1}
          className="docs-form-status"
          role={statusName ? "group" : undefined}
          aria-label={statusName}
        >
          {summaryTitle && (
            <Banner tone="danger" title={summaryTitle} role={undefined}>
              <ul>
                {failed.map(([field, message]) => (
                  <li key={field}>
                    <a className="sw-link" href={`#${FIELD_IDS[field]}`}>
                      {message}
                    </a>
                  </li>
                ))}
              </ul>
            </Banner>
          )}
          {sent && (
            <Banner tone="success" title="Enquiry sent" role={undefined}>
              <p>We reply within two working days.</p>
            </Banner>
          )}
        </div>
        <TextField
          id={FIELD_IDS.name}
          label="Name"
          description="Required."
          isRequired
          validationBehavior="aria"
          value={name}
          onChange={setName}
          isInvalid={errors.name !== undefined}
          errorMessage={errors.name}
        />
        <TextField
          id={FIELD_IDS.email}
          label="Email"
          type="email"
          description="Required. We reply to this address."
          isRequired
          validationBehavior="aria"
          value={email}
          onChange={setEmail}
          isInvalid={errors.email !== undefined}
          errorMessage={errors.email}
        />
        <Select label="Discipline" defaultValue="wayfinding">
          <SelectItem id="wayfinding">Wayfinding</SelectItem>
          <SelectItem id="identity">Identity</SelectItem>
          <SelectItem id="exhibition">Exhibition</SelectItem>
        </Select>
        <RadioGroup label="Budget" defaultValue="middle">
          <Radio value="small">Under CHF 20,000</Radio>
          <Radio value="middle">CHF 20,000 to 80,000</Radio>
          <Radio value="large">Over CHF 80,000</Radio>
        </RadioGroup>
        <TextArea
          label="Brief"
          description="Optional. Two or three sentences."
          rows={4}
        />
        <div>
          <Button type="submit" variant="primary">
            Send enquiry
          </Button>
        </div>
      </Stack>
    </form>
  );
}
