# sfdx-project-metadata-coverage

[![NPM](https://img.shields.io/npm/v/@salesforce/plugin-template.svg?label=@salesforce/plugin-template)](https://www.npmjs.com/package/@salesforce/plugin-template) [![CircleCI](https://circleci.com/gh/salesforcecli/plugin-template/tree/main.svg?style=shield)](https://circleci.com/gh/salesforcecli/plugin-template/tree/main) [![Downloads/week](https://img.shields.io/npm/dw/@salesforce/plugin-template.svg)](https://npmjs.org/package/@salesforce/plugin-template) [![License](https://img.shields.io/badge/License-BSD%203--Clause-brightgreen.svg)](https://raw.githubusercontent.com/salesforcecli/plugin-template/main/LICENSE.txt)

This plugin displays information from the [Metadata Coverage Report](https://developer.salesforce.com/docs/metadata-coverage) for metadata files in a SFDX project.

## Installation into the Salesforce CLI

```bash
$ sfdx plugins:install https://github.com/mkreth/sfdx-project-metadata-coverage
```

## Issues

Please report any issues at https://github.com/mkreth/sfdx-project-metadata-coverage

## Commands

<!-- commands -->

### `sfdx project:coverage:report [-d <directory>] [--showuncovered] [--checkmetadataapi] [--checksourcetracking] [--checkunlockedpackagingwithoutnamespace] [--checkunlockedpackagingwithnamespace] [--checkmanagedpackaging] [--checkchangesets] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

displays metadata coverage information for metadata files in a SFDX project

```
USAGE
  $ sfdx project:coverage:report [-d <directory>] [--showuncovered] [--checkmetadataapi] [--checksourcetracking] [--checkunlockedpackagingwithoutnamespace] [--checkunlockedpackagingwithnamespace] [--checkmanagedpackaging]
  [--checkchangesets] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -d, --source=source                                                               path of the source directory to scan for metadata files
  --checkchangesets                                                                 Check for Change Sets coverage
  --checkmanagedpackaging                                                           Check for Managed Packaging coverage
  --checkmetadataapi                                                                Check for Metadata Api coverage
  --checksourcetracking                                                             Check for Source Tracking coverage
  --checkunlockedpackagingwithnamespace                                             Check for Unlocked Packaging (with Namespace) coverage
  --checkunlockedpackagingwithoutnamespace                                          Check for Unlocked Packaging (without Namespace) coverage
  --json                                                                            format output as json
  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for this command invocation
  --showuncovered                                                                   show only metadata files that are uncovered by (any of) the selected deployment methods

DESCRIPTION
  Displays metadata coverage information for the metadata files in the current project.

  Detects metadata files in all package directories of the current project. Use --source to print metadata coverage information for a subset of metadata files in specific folders only.

  Use one of the --check... flags to display coverage information for the specified deployment method.

  Use --showuncovered to display only metadata files that are not covered by the selected deployment method(s).

EXAMPLES
  $ sfdx project:metadata:coverage
  Finding metadata coverage information for metadata files... done
  Package Directory  Type         Name            Folder                 Metadata Api  Source Tracking  Unlocked Packaging (without Namespace)  Unlocked Packaging (with Namespace)  Managed Packaging  Change Sets
  -----------------  -----------  --------------  ---------------------  ------------  ---------------  --------------------------------------  -----------------------------------  -----------------  -----------
  core               ApexClass    LogManager.cls  main/default/classes   true          true             true                                    true                                 true               true
  ext                Profile      Admin.profile   main/default/profiles  true          true             true                                    true                                 true               false

  $ sfdx project:metadata:coverage -d force-app/main/default/classes,force-app/main/default/profiles
  Finding metadata coverage information for metadata files... done
  Type         Name            Folder                           Metadata Api  Source Tracking  Unlocked Packaging (without Namespace)  Unlocked Packaging (with Namespace)  Managed Packaging  Change Sets
  -----------  --------------  -------------------------------  ------------  ---------------  --------------------------------------  -----------------------------------  -----------------  -----------
  ApexClass    LogManager.cls  force-app/main/default/classes   true          true             true                                    true                                 true               true
  Profile      Admin.profile   force-app/main/default/profiles  true          true             true                                    true                                 true               false

  $ sfdx project:metadata:coverage --checkmetadataapi --checkunlockedpackagingwithoutnamespace --checkchangesets --showuncovered
  Finding metadata coverage information for metadata files... done
  Type         Name            Folder                           Metadata Api  Unlocked Packaging (without Namespace)  Change Sets
  -----------  --------------  -------------------------------  ------------  --------------------------------------  -----------
  Profile      Admin.profile   force-app/main/default/profiles  true          true                                    false
```

<!-- commandsstop -->
