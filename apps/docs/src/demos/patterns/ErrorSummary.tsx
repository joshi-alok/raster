import { Banner } from "@raster/react";

export default function ErrorSummary() {
  return (
    <Banner tone="danger" title="Fix 2 fields to send the enquiry">
      <ul>
        <li>
          <a className="sw-link" href="#enquiry-name">
            Enter your name.
          </a>
        </li>
        <li>
          <a className="sw-link" href="#enquiry-email">
            Enter an email address such as name@studio.ch.
          </a>
        </li>
      </ul>
    </Banner>
  );
}
