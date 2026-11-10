import { Chip, TagGroup } from "@rasterdesign/react";

export default function Disciplines() {
  return (
    <TagGroup
      label="Discipline"
      description="Show projects in any of the chosen disciplines."
      defaultSelectedKeys={["identity", "editorial"]}
    >
      <Chip id="identity">Identity</Chip>
      <Chip id="wayfinding">Wayfinding</Chip>
      <Chip id="editorial">Editorial</Chip>
      <Chip id="digital">Digital</Chip>
    </TagGroup>
  );
}
