import fs from 'fs/promises';

export const readJson = async (path) => {
  let data = await fs.readFile(path);
  return JSON.parse(data.toString());
}

export const writeJson = async (json, path) => {
  await fs.writeFile(path, JSON.stringify(json, undefined, 2));
}
