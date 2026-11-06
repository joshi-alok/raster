import { Pagination } from "@raster/react";

export default function First() {
  return <Pagination aria-label="Example pagination, first page" page={1} total={4} href={(page) => `?page=${page}`} />;
}
