import { loadContentIndex } from "../src/lib/content/load.ts";

const { writings } = loadContentIndex();
console.log(JSON.stringify(writings.map((writing) => writing.slug)));
