/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import recursiveReaddir = require('recursive-readdir');
import { parseString } from 'xml2js';
import { readFileSync } from 'fs-extra';
import { core, flags, FlagsConfig, SfdxCommand, TableOptions } from '@salesforce/command';
import { NamedPackageDir, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import fetch from 'node-fetch';

interface MetadataTypeCoverageChannels {
  [key: string]: boolean;
  unlockedPackagingWithoutNamespace: boolean;
  unlockedPackagingWithNamespace: boolean;
  toolingApi: boolean;
  sourceTracking: boolean;
  metadataApi: boolean;
  managedPackaging: boolean;
  classicUnmanagedPackaging: boolean;
  classicManagedPackaging: boolean;
  changeSets: boolean;
  apexMetadataApi: boolean;
}

interface MetadataFile {
  path: string;
  packageDirectory?: string;
  folder: string;
  fileName: string;
  type?: string;
  coverage?: MetadataTypeCoverageChannels;
}

interface MetadataFilesInDirectory {
  dir: NamedPackageDir;
  metadataFiles: MetadataFile[];
}

interface MetadataTypeCoverage {
  details: AnyJson[];
  channels: MetadataTypeCoverageChannels;
}

interface MetadataCoverageReportVersions {
  selected: number;
  max: number;
  min: number;
}

interface MetadataCoverageReport {
  [type: string]: MetadataTypeCoverage;
}

interface MetadataCoverageReportResponse {
  types: MetadataCoverageReport;
  versions: MetadataCoverageReportVersions;
}

interface Response {
  message?: string;
  metadataCoverageReport?: MetadataFile[];
}

interface ChannelFlag {
  key: string;
  columnKey: string;
  columnLabel: string;
  flagDescription: string;
}

interface ChannelFlags {
  [key: string]: ChannelFlag;
}

const DEFAULT_API_VERSION = '51';

const CHECK_CHANNEL_FLAGS: ChannelFlags = {
  checkmetadataapi: {
    key: 'metadataApi',
    columnKey: 'coverage.metadataApi',
    columnLabel: 'columnMetadataApiLabel',
    flagDescription: 'checkMetadataApiFlagDescription',
  },
  checksourcetracking: {
    key: 'sourceTracking',
    columnKey: 'coverage.sourceTracking',
    columnLabel: 'columnSourceTrackingLabel',
    flagDescription: 'checkSourceTrackingFlagDescription',
  },
  checkunlockedpackagingwithoutnamespace: {
    key: 'unlockedPackagingWithoutNamespace',
    columnKey: 'coverage.unlockedPackagingWithoutNamespace',
    columnLabel: 'columnUnlockedPackagingWithoutNamespaceLabel',
    flagDescription: 'checkUnlockedPackagingWithoutNamespaceFlagDescription',
  },
  checkunlockedpackagingwithnamespace: {
    key: 'unlockedPackagingWithNamespace',
    columnKey: 'coverage.unlockedPackagingWithNamespace',
    columnLabel: 'columnUnlockedPackagingWithNamespaceLabel',
    flagDescription: 'checkUnlockedPackagingWithNamespaceFlagDescription',
  },
  checkmanagedpackaging: {
    key: 'managedPackaging',
    columnKey: 'coverage.managedPackaging',
    columnLabel: 'columnManagedPackagingLabel',
    flagDescription: 'checkManagedPackagingFlagDescription',
  },
  checkchangesets: {
    key: 'changeSets',
    columnKey: 'coverage.changeSets',
    columnLabel: 'columnChangeSetsLabel',
    flagDescription: 'checkChangeSetsFlagDescription',
  },
};

core.Messages.importMessagesDirectory(__dirname);

const messages = core.Messages.loadMessages('@mkreth/sfdx-metadata-coverage', 'coverage-report');

export default class CoverageReportCommand extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx project:metadata:coverage
Finding metadata coverage information for metadata files... done
Package Directory  Type         Name            Folder                 Metadata Api  Source Tracking  Unlocked Packaging (without Namespace)  Unlocked Packaging (with Namespace)  Managed Packaging  Change Sets
-----------------  -----------  --------------  ---------------------  ------------  ---------------  --------------------------------------  -----------------------------------  -----------------  -----------
core               ApexClass    LogManager.cls  main/default/classes   true          true             true                                    true                                 true               true
ext                Profile      Admin.profile   main/default/profiles  true          true             true                                    true                                 true               false
    `,
    `$ sfdx project:metadata:coverage -d force-app/main/default/classes,force-app/main/default/profiles
Finding metadata coverage information for metadata files... done
Type         Name            Folder                           Metadata Api  Source Tracking  Unlocked Packaging (without Namespace)  Unlocked Packaging (with Namespace)  Managed Packaging  Change Sets
-----------  --------------  -------------------------------  ------------  ---------------  --------------------------------------  -----------------------------------  -----------------  -----------
ApexClass    LogManager.cls  force-app/main/default/classes   true          true             true                                    true                                 true               true
Profile      Admin.profile   force-app/main/default/profiles  true          true             true                                    true                                 true               false
    `,
    `$ sfdx project:metadata:coverage --checkmetadataapi --checkunlockedpackagingwithoutnamespace --checkchangesets --showuncovered
Finding metadata coverage information for metadata files... done
Type         Name            Folder                           Metadata Api  Unlocked Packaging (without Namespace)  Change Sets
-----------  --------------  -------------------------------  ------------  --------------------------------------  -----------
Profile      Admin.profile   force-app/main/default/profiles  true          true                                    false
    `,
  ];

  protected static flagsConfig: FlagsConfig = CoverageReportCommand.getFlagsConfig();
  protected static requiresUsername = false;
  protected static requiresDevhubUsername = false;
  protected static requiresProject = true;

  private static getFlagsConfig(): FlagsConfig {
    const flagsConfig: FlagsConfig = {
      source: flags.directory({ char: 'd', description: messages.getMessage('sourceFlagDescription') }),
      showuncovered: flags.boolean({ description: messages.getMessage('showUncoveredFlagDescription') }),
    };
    Object.keys(CHECK_CHANNEL_FLAGS).forEach((key) => {
      flagsConfig[key] = flags.boolean({ description: messages.getMessage(CHECK_CHANNEL_FLAGS[key].flagDescription) });
    });
    return flagsConfig;
  }

  public async run(): Promise<Response> {
    const response: Response = {};

    try {
      // collect all metadata files (files ending with "-meta.xml")
      this.ux.startSpinner(messages.getMessage('statusSearchingMetadataMessage'));
      const metadataFiles: MetadataFile[] = await this.findMetadataFiles();

      // exit if there are no metadata files
      if (metadataFiles.length === 0) {
        this.ux.warn('No metadata in any package directory - exiting');
        response.message = 'No metadata in any package directory';
        return response;
      }

      // retrieve md coverage report - https://mdcoverage.secure.force.com/services/apexrest/report?version=52
      this.ux.startSpinner(messages.getMessage('statusFetchMetadataCoverageMessage'));
      const metadataCoverageReport = await this.fetchMetadataCoverageData();

      // determine the metadata type of a metadata file --> enrich metadata file with its type
      this.ux.startSpinner(messages.getMessage('statusReadingMetadataTypeMessage'));
      await Promise.all(metadataFiles.map((metadataFile) => this.determineMetadataType(metadataFile)));

      // enrich metadata file with its coverage information from the metadata coverage report
      this.ux.startSpinner(messages.getMessage('statusFindingMetadataCoverageMessage'));
      metadataFiles.forEach((metadataFile) => {
        const metadataTypeCoverage = metadataCoverageReport[metadataFile.type];
        metadataFile.coverage = metadataTypeCoverage.channels;
      });

      this.ux.stopSpinner(messages.getMessage('statusFinishedMessage'));

      // create tabular project metadata coverage report
      // const showPackageDirectory = this.project.getUniquePackageDirectories().length > 1;

      // this.ux.table(metadataFiles, this.tableOptions(showPackageDirectory));
      this.printResultTable(metadataFiles);

      // return the metadata files and their coverage information
      response.metadataCoverageReport = metadataFiles;

      return response;
    } catch (ex) {
      this.ux.error(ex);
      throw new SfdxError(ex);
    }
  }

  private recursiveReadPackageDir(
    projectPath: string,
    packageDir?: NamedPackageDir,
    dir?: string
  ): Promise<MetadataFilesInDirectory> {
    return new Promise((resolve, reject) => {
      recursiveReaddir(packageDir?.fullPath ?? dir)
        .then((results: string[]) => {
          const metaXmlFiles: string[] = results.filter((result: string) => result.endsWith('-meta.xml'));
          const metadataFiles = metaXmlFiles.map((metaXmlFile: string) => {
            const relativePath = path.relative(projectPath, metaXmlFile);
            const folder = packageDir
              ? path.relative(packageDir.fullPath, path.dirname(metaXmlFile))
              : path.dirname(metaXmlFile);
            const metadataFile: MetadataFile = {
              path: metaXmlFile,
              folder,
              fileName: path.basename(relativePath, '-meta.xml'),
            };
            if (packageDir) {
              metadataFile.packageDirectory = packageDir.name;
            }
            return metadataFile;
          });
          const metadataFilesInPackageDirectory: MetadataFilesInDirectory = {
            dir: packageDir,
            metadataFiles,
          };
          resolve(metadataFilesInPackageDirectory);
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }

  private async findMetadataFiles(): Promise<MetadataFile[]> {
    const projectPath: string = this.project.getPath();
    const packageDirectories: NamedPackageDir[] = this.project.getUniquePackageDirectories();
    const source: string = this.flags.source as string;
    const metadataFileResolvers: Array<Promise<MetadataFilesInDirectory>> = source
      ? source.split(',').map((directory) => this.recursiveReadPackageDir(projectPath, null, directory))
      : packageDirectories.map((packageDirectory) => this.recursiveReadPackageDir(projectPath, packageDirectory));
    const metadataFilesInPackageDirectories: MetadataFilesInDirectory[] = await Promise.all(
      metadataFileResolvers
      // packageDirectories.map((packageDirectory) => this.recursiveReadPackageDir(projectPath, packageDirectory))
    );

    if (metadataFilesInPackageDirectories.length === 0) {
      this.ux.warn(messages.getMessage('logMessageNoPackageDirectories'));
    }
    metadataFilesInPackageDirectories.forEach((metadataFilesInPackageDirectory: MetadataFilesInDirectory) => {
      if (metadataFilesInPackageDirectory.metadataFiles.length === 0) {
        this.ux.warn(
          messages.getMessage('logMessageNoMetadataFilesInPackageDirectory', [metadataFilesInPackageDirectory.dir.name])
        );
      }
    });

    const metadataFiles: MetadataFile[] = [];
    return metadataFiles.concat(
      ...metadataFilesInPackageDirectories.map(
        (metadataFilesInPackageDirectory: MetadataFilesInDirectory) => metadataFilesInPackageDirectory.metadataFiles
      )
    );
  }

  private async fetchMetadataCoverageData(): Promise<MetadataCoverageReport> {
    const apiVersion: string = this.getApiVersion();
    const metadataCoverageReportUrl = `https://mdcoverage.secure.force.com/services/apexrest/report?version=${apiVersion}`;
    const requestSettings = { method: 'Get' };

    return new Promise((resolve, reject) => {
      fetch(metadataCoverageReportUrl, requestSettings)
        .then((response) => {
          return response.json() as Promise<MetadataCoverageReportResponse>;
        })
        .then((jsonResponse) => {
          resolve(jsonResponse.types);
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }

  private getApiVersion(): string {
    const sourceApiVersion: string = this.project.getSfdxProjectJson().get('sourceApiVersion') as string;
    if (sourceApiVersion) {
      if (sourceApiVersion.includes('.')) {
        return sourceApiVersion.substring(0, sourceApiVersion.indexOf('.'));
      } else {
        return sourceApiVersion;
      }
    } else {
      return DEFAULT_API_VERSION;
    }
  }

  private determineMetadataType(metadataFile: MetadataFile): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
    const data = readFileSync(metadataFile.path);
    return new Promise((resolve, reject) => {
      this.parseXml2Json(data)
        .then((metadataJson) => {
          Object.keys(metadataJson).forEach((type) => {
            metadataFile.type = type;
          });
          resolve();
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }

  private parseXml2Json(data: string): Promise<AnyJson> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      parseString(data, function (error, result) {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result);
        }
      });
    });
  }

  private tableOptions(showPackageDir: boolean): TableOptions {
    const options: TableOptions = {
      columns: [
        { key: 'type', label: messages.getMessage('columnTypeLabel') },
        { key: 'fileName', label: messages.getMessage('columnNameLabel') },
        { key: 'folder', label: messages.getMessage('columnFolderLabel') },
      ],
    };

    if (showPackageDir) {
      options.columns.unshift({ key: 'packageDirectory', label: messages.getMessage('columnPackageDirectoryLabel') });
    }

    const includeAll = this.includeAllChecks();
    Object.keys(CHECK_CHANNEL_FLAGS).forEach((flag) => {
      if (includeAll || (this.flags[flag] as boolean)) {
        const channel = CHECK_CHANNEL_FLAGS[flag];
        options.columns.push({ key: channel.columnKey, label: messages.getMessage(channel.columnLabel) });
      }
    });

    return options;
  }

  private includeAllChecks(): boolean {
    const anyCheckFlagPresent = Object.keys(CHECK_CHANNEL_FLAGS)
      .map((flag) => this.flags[flag] as boolean)
      .reduce((prev, curr) => prev || curr);

    if (anyCheckFlagPresent) {
      return false;
    }

    return true;
  }

  private printResultTable(metadataFiles: MetadataFile[]): void {
    const showPackageDirectory = this.project.getUniquePackageDirectories().length > 1;
    const showUncoveredOnly = this.flags.showuncovered as boolean;
    const filteredMetadataFiles = showUncoveredOnly ? this.filterUncoveredMetadataFiles(metadataFiles) : metadataFiles;

    this.ux.table(filteredMetadataFiles, this.tableOptions(showPackageDirectory));
  }

  private filterUncoveredMetadataFiles(metadataFiles: MetadataFile[]): MetadataFile[] {
    const includeAllChecks: boolean = this.includeAllChecks();
    const filterFlags = Object.keys(CHECK_CHANNEL_FLAGS).filter(
      (flag) => includeAllChecks || (this.flags[flag] as boolean)
    );
    const filteredMetadataFiles = metadataFiles.filter((metadataFile) => {
      const channelCoverage = filterFlags.map((flag) => metadataFile.coverage[CHECK_CHANNEL_FLAGS[flag].key]);
      const allChannelsCovered = channelCoverage.reduce((prev, curr) => prev && curr, true);
      const anyChannelUncovered = !allChannelsCovered;
      return anyChannelUncovered;
    });

    return filteredMetadataFiles;
  }
}
