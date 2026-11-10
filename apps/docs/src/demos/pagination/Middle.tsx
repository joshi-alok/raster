import { Pagination } from "@rasterdesign/react";

export default function Middle() {
  return <Pagination aria-label="Example pagination" page={6} total={12} href={(page) => `?page=${page}`} />;
}
