import { Link, Stack, Text } from "@rasterdesign/react";

export default function Kinds() {
  return (
    <Stack gap={3}>
      <Text>
        Read the <Link href="/foundations/grid/">grid foundations</Link> first.
      </Text>
      <Text>
        <Link href="https://www.w3.org/WAI/standards-guidelines/wcag/" external>
          WCAG 2.2
        </Link>
      </Text>
      <Text>
        <Link href="/components/link/" aria-current="page">
          The current page
        </Link>
      </Text>
    </Stack>
  );
}
