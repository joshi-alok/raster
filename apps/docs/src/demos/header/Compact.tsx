import { Header, Link } from "@raster/react";

/** Shown in a 360px frame, so the header is compact at every screen width. */
export default function Compact() {
  return (
    <div className="docs-frame-narrow">
      <Header sticky={false} navLabel="Compact example" brand={<Link href="/">Studio</Link>}>
        <Link href="/components/header/" aria-current="page">
          Work
        </Link>
        <Link href="/templates/">Templates</Link>
        <Link href="/">About</Link>
      </Header>
    </div>
  );
}
