export function formatCai(value: string): string {
  const normalized = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 32);
  const groups: string[] = [];
  for (let index = 0; index < normalized.length; index += 6) {
    groups.push(normalized.slice(index, index === 30 ? 32 : index + 6));
  }
  return groups.join("-");
}
