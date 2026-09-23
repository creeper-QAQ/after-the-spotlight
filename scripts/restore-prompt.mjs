import { restoreVersion } from './versions.mjs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
try {
  const result = await restoreVersion(root, process.env.VERSION_ID);
  console.log(`已恢复到独立目录：\n${result.target}\n当前版本未被覆盖。`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
