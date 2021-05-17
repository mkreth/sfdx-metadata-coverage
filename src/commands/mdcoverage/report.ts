/*
 * Copyright (c) 2021, Magnus Kreth.
 * All rights reserved.
 * Licensed under the MIT license.
 * For full license text, see file LICENSE.txt in the repository root.
 */

import { core, flags, FlagsConfig, SfdxCommand, TableOptions } from '@salesforce/command';
import { SfdxError } from '@salesforce/core';

import fetchMetadataCoverageReport from '../../coveragereport';
import findMetadataFiles from '../../metadatafiles';

import type { MetadataCoverageReport, MetadataTypeCoverageChannels } from '../../coveragereport';
import type { MetadataFile } from '../../metadatafiles';

type MetadataFileCoverage = {
  file: MetadataFile;
  coverage: MetadataTypeCoverageChannels;
};

type MetadataFileCoverageResponse = {
  file: MetadataFile;
  metadataApi?: boolean;
  sourceTracking?: boolean;
  unlockedPackagingWithoutNamespace?: boolean;
  unlockedPackagingWithNamespace?: boolean;
  managedPackaging?: boolean;
  changeSets?: boolean;
};

type ChannelFlag = {
  key: string;
  columnKey: string;
  columnLabel: string;
  flagDescription: string;
};

type ChannelFlags = {
  [key: string]: ChannelFlag;
};

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
    `$ sfdx mdcoverage:report
Finding metadata coverage information for metadata files... done
Type         Name            Folder                 Metadata Api  Source Tracking  Unlocked Packaging (without Namespace)  Unlocked Packaging (with Namespace)  Managed Packaging  Change Sets
-----------  --------------  ---------------------  ------------  ---------------  --------------------------------------  -----------------------------------  -----------------  -----------
ApexClass    LogManager.cls  main/default/classes   true          true             true                                    true                                 true               true
Profile      Admin.profile   main/default/profiles  true          true             true                                    true                                 true               false
`,
    `$ sfdx mdcoverage:report -d force-app/main/default/classes,force-app/main/default/profiles
Finding metadata coverage information for metadata files... done
Type         Name            Folder                           Metadata Api  Source Tracking  Unlocked Packaging (without Namespace)  Unlocked Packaging (with Namespace)  Managed Packaging  Change Sets
-----------  --------------  -------------------------------  ------------  ---------------  --------------------------------------  -----------------------------------  -----------------  -----------
ApexClass    LogManager.cls  force-app/main/default/classes   true          true             true                                    true                                 true               true
Profile      Admin.profile   force-app/main/default/profiles  true          true             true                                    true                                 true               false
`,
    `$ sfdx mdcoverage:report --checkmetadataapi --checkunlockedpackagingwithoutnamespace --checkchangesets --showuncovered
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
      apiversion: flags.builtin(),
      sourcepath: flags.directory({ char: 'd', description: messages.getMessage('sourcePathFlagDescription') }),
      showuncovered: flags.boolean({ description: messages.getMessage('showUncoveredFlagDescription') }),
    };

    Object.keys(CHECK_CHANNEL_FLAGS).forEach((key) => {
      flagsConfig[key] = flags.boolean({ description: messages.getMessage(CHECK_CHANNEL_FLAGS[key].flagDescription) });
    });

    return flagsConfig;
  }

  public async run(): Promise<MetadataFileCoverageResponse[]> {
    try {
      this.ux.startSpinner(messages.getMessage('statusSearchingMetadataMessage'));
      const metadataFiles = await this.findMetadataFiles();

      // exit if there are no metadata files
      if (metadataFiles.length === 0) {
        this.ux.warn('No metadata files found - exiting');
        return [];
      }

      this.ux.startSpinner(messages.getMessage('statusFetchMetadataCoverageMessage'));
      const metadataCoverageReport = await this.fetchMetadataCoverageReport();

      // enrich metadata file with its coverage information from the metadata coverage report
      this.ux.startSpinner(messages.getMessage('statusFindingMetadataCoverageMessage'));
      const metadataFileCoverages = metadataFiles
        .map((metadataFile) => {
          const metadataTypeCoverage = metadataCoverageReport[metadataFile.type];
          if (metadataTypeCoverage && metadataTypeCoverage.channels) {
            return {
              file: metadataFile,
              coverage: metadataTypeCoverage.channels,
            } as MetadataFileCoverage;
          } else {
            this.ux.warn(
              messages.getMessage('logMessageNoCoverageInformation', [metadataFile.path, metadataFile.type])
            );
          }
        })
        .filter((metadataFileCoverage) => metadataFileCoverage !== undefined);

      const filteredMetadataFileCoverages = this.filteredMetadataFileCoverages(metadataFileCoverages);

      this.ux.stopSpinner(messages.getMessage('statusFinishedMessage'));

      this.printResultTable(filteredMetadataFileCoverages);

      // return the metadata files and their coverage information
      const metadataCoverageReportResponse = this.reducedMetadataFileCoverages(filteredMetadataFileCoverages);

      return metadataCoverageReportResponse;
    } catch (ex) {
      this.ux.error(ex);
      throw new SfdxError(ex);
    }
  }

  private findMetadataFiles(): Promise<MetadataFile[]> {
    if (this.flags.sourcepath) {
      const sourcepath = this.flags.sourcepath as string;
      return findMetadataFiles(...sourcepath.split(','));
    } else {
      return findMetadataFiles(
        ...this.project.getUniquePackageDirectories().map((packageDirectory) => packageDirectory.path)
      );
    }
  }

  private fetchMetadataCoverageReport(): Promise<MetadataCoverageReport> {
    if (this.flags.apiversion) {
      const flagApiVersion = this.flags.apiversion as string;
      return fetchMetadataCoverageReport(flagApiVersion);
    } else {
      const sourceApiVersion = this.project.getSfdxProjectJson().get('sourceApiVersion') as string;
      if (sourceApiVersion) {
        return fetchMetadataCoverageReport(sourceApiVersion);
      }
    }

    return fetchMetadataCoverageReport();
  }

  private filteredChannelFlags(): string[] {
    const anyCheckFlagPresent = Object.keys(CHECK_CHANNEL_FLAGS)
      .map((flag) => this.flags[flag] as boolean)
      .reduce((prev, curr) => prev || curr, false);
    const includeAllFlags = !anyCheckFlagPresent;
    const filterFlags = Object.keys(CHECK_CHANNEL_FLAGS).filter(
      (flag) => includeAllFlags || (this.flags[flag] as boolean)
    );
    return filterFlags;
  }

  private filteredMetadataFileCoverages(metadataFiles: MetadataFileCoverage[]): MetadataFileCoverage[] {
    const showUncoveredOnly = this.flags.showuncovered as boolean;
    const filteredChannelFlags = this.filteredChannelFlags();

    const filteredMetadataFiles = metadataFiles.filter((metadataFile) => {
      let include = true;
      if (showUncoveredOnly) {
        const selectedChannelsCoverage = filteredChannelFlags.map(
          (flag) => metadataFile.coverage[CHECK_CHANNEL_FLAGS[flag].key]
        );
        const allChannelsCovered = selectedChannelsCoverage.reduce((prev, curr) => prev && curr, true);

        include = !allChannelsCovered;
      }
      return include;
    });

    return filteredMetadataFiles;
  }

  private reducedMetadataFileCoverages(metadataFiles: MetadataFileCoverage[]): MetadataFileCoverageResponse[] {
    const filteredChannelFlags = this.filteredChannelFlags();
    const reducedMetadataFileCoverages = metadataFiles.map((metadataFile) => {
      const metadataFileCoverageResponse: MetadataFileCoverageResponse = {
        file: metadataFile.file,
      };
      filteredChannelFlags.forEach((flag) => {
        const key = CHECK_CHANNEL_FLAGS[flag].key;
        const channelCoverage = metadataFile.coverage[key];
        metadataFileCoverageResponse[key] = channelCoverage;
      });
      return metadataFileCoverageResponse;
    });

    return reducedMetadataFileCoverages;
  }

  private printResultTable(metadataFiles: MetadataFileCoverage[]): void {
    const options: TableOptions = {
      columns: [
        { key: 'file.type', label: messages.getMessage('columnTypeLabel') },
        { key: 'file.fileName', label: messages.getMessage('columnNameLabel') },
        { key: 'file.folder', label: messages.getMessage('columnFolderLabel') },
      ],
    };

    const filteredChannelFlags = this.filteredChannelFlags();
    filteredChannelFlags.forEach((flag) => {
      const channel = CHECK_CHANNEL_FLAGS[flag];
      options.columns.push({ key: channel.columnKey, label: messages.getMessage(channel.columnLabel) });
    });

    this.ux.table(metadataFiles, options);
  }
}
