import { Accordion, Disclosure } from "@raster/react";

export default function Faq() {
  return (
    <Accordion>
      <Disclosure id="cost" title="What does a project cost?">
        <p>Most identity projects start at CHF 40,000. We quote a fixed fee after the first meeting.</p>
      </Disclosure>
      <Disclosure id="time" title="How long does it take?">
        <p>Twelve to sixteen weeks from the first interview to the hand-over.</p>
      </Disclosure>
      <Disclosure id="after" title="What happens after launch?">
        <p>We stay on call for a year and review the system with your team after six months.</p>
      </Disclosure>
    </Accordion>
  );
}
