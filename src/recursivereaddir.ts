/*
 * Copyright (c) 2021, Magnus Kreth.
 * All rights reserved.
 * Licensed under the MIT license.
 * For full license text, see file LICENSE.txt in the repository root.
 */

import * as fs from 'fs';
import recursiveReaddir = require('recursive-readdir');
type IgnoreFunction = (file: string, stats: fs.Stats) => boolean;
type RecursiveReaddirIgnores = ReadonlyArray<string | IgnoreFunction>;

export { recursiveReaddir };
export type { RecursiveReaddirIgnores };
