import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

export async function saveXlsx(
  defaultName: string,
  bytes: Uint8Array,
): Promise<boolean> {
  const path = await save({
    defaultPath: defaultName,
    filters: [{ name: "Excel", extensions: ["xlsx"] }],
  });
  if (path === null) {
    return false;
  }
  await writeFile(path, bytes);
  return true;
}
