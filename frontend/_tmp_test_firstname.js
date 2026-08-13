const VIETNAMESE_MIDDLE_NAME_MARKERS = ["Thị", "Văn"];
function getFirstName(fullName) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return parts[0] ?? "";
  if (VIETNAMESE_MIDDLE_NAME_MARKERS.includes(parts[1])) {
    return parts.slice(2).join(" ");
  }
  return parts[parts.length - 1];
}
const names = [
  "Nguyễn Thị Lan Anh",
  "Trần Văn Minh",
  "Phạm Thị Mai",
  "Lê Hoàng Nam",
  "Vũ Thị Thu Hà",
  "Đặng Quốc Huy",
  "Hoàng Thị Ngọc",
  "Bùi Văn Tuấn",
  "Đỗ Thị Phương",
  "Ngô Minh Đức",
  "Alex Chen",
  "Madonna",
];
for (const n of names) console.log(n.padEnd(24), "->", getFirstName(n));
