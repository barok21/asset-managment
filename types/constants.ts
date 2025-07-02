
export const UOM_OPTIONS = [
  { label: "Piece (pc)", value: "pc" },
  { label: "Set", value: "set" },
  { label: "Box", value: "box" },
  { label: "Package (pkg)", value: "pkg" },
  { label: "Pair", value: "pair" },
  { label: "Kilogram (kg)", value: "kg" },
  { label: "Liter (l)", value: "l" },
  { label: "Meter (m)", value: "m" },
  { label: "Square Meter (sqm)", value: "sqm" },
] as const;

export type UoM = typeof UOM_OPTIONS[number]["label"];
