import * as fs from 'fs';
import recursiveReaddir = require('recursive-readdir');
type IgnoreFunction = (file: string, stats: fs.Stats) => boolean;
type RecursiveReaddirIgnores = ReadonlyArray<string | IgnoreFunction>;

export { recursiveReaddir };
export type { RecursiveReaddirIgnores };
