/*
 * Copyright (c) 2021, Magnus Kreth.
 * All rights reserved.
 * Licensed under the MIT license.
 * For full license text, see file LICENSE.txt in the repository root.
 */

import { basename, dirname } from 'path';
import { readFile, Stats } from 'fs';
import { parseStringPromise } from 'xml2js';
import { JsonMap } from '@salesforce/ts-types';
import recursiveReaddir = require('recursive-readdir');

export type MetadataFile = {
  path: string;
  fileName: string;
  folder: string;
  type: string;
};

function ignoreNonMetaXmlFiles(file: string, stats: Stats): boolean {
  return stats.isFile() && !basename(file).endsWith('-meta.xml');
}

function readFileAsync(file: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    readFile(file, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

async function readFileJson(file: string): Promise<JsonMap> {
  /* eslint-disable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-return */
  try {
    const data = await readFileAsync(file);
    const fileJson = await parseStringPromise(data);

    return fileJson;
  } catch (err) {
    const error: Error = err as Error;
    throw new Error(`could not read metadata file ${file} - caused by: ${error.message}`);
  }
}

export default function findMetadataFiles(...directories: string[]): Promise<MetadataFile[]> {
  if (!directories || !directories.length) {
    throw new Error('no directories with metadata files');
  }

  return Promise.all(
    directories.map((directory) =>
      recursiveReaddir(directory, [ignoreNonMetaXmlFiles]).then((files) =>
        Promise.all(
          files.map(async (file) => {
            const fileJson = await readFileJson(file);
            if (fileJson) {
              const metadataFile: MetadataFile = {
                path: file,
                fileName: basename(file, '-meta.xml'),
                folder: dirname(file),
                type: Object.keys(fileJson)[0],
              };
              return metadataFile;
            } else {
              throw new Error(`could not read metadata file ${file}`);
            }
          })
        )
      )
    )
  ).then((metadataFilesInDirectories) => {
    const emptyMetadataFiles: MetadataFile[] = [];
    const allMetadataFiles = emptyMetadataFiles.concat(...metadataFilesInDirectories);
    return allMetadataFiles.filter((metadataFile) => metadataFile !== undefined);
  });
}
