import { Button, Header, Link } from "@raster/react";

export default function Basic() {
  return (
    <Header
      compact={false}
      sticky={false}
      navLabel="Example site"
      brand={<Link href="/">Studio</Link>}
      actions={<Button variant="ghost">Sign in</Button>}
    >
      <Link href="/components/header/" aria-current="page">
        Work
      </Link>
      <Link href="/templates/">Templates</Link>
      <Link href="/">About</Link>
    </Header>
  );
}
