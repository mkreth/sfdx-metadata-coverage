# sfdx-project-metadata-coverage

This plugin displays information from the [Metadata Coverage Report](https://developer.salesforce.com/docs/metadata-coverage) for metadata files in a SFDX project.

It retrieves the metadata coverage information from the same Salesforce API that is used to render the Metadata Coverage Report. This API is not officially documented by Salesforce, hence, can change at any time which will break this plugin. Therefore, use this plugin at your own risk.

## Why would you use this plugin

If you have a team delivering a Salesforce implementation and you have chosen a delivery approach involving unlocked packages then you have probably setup multiple package directories for metadata files to go into different unlocked packages or to be part of a metadata package for anything that can not be included in an unlocked package at that time. You want to make sure that you detect early when somebody on your team has accidentally added a new metadata file to a package directory corresponding to an unlocked package but where the same metadata file is not supported for unlocked packaging.
The Metadata Coverage Report can tell you but you still have to look for these new metadata files and check the Metadata Coverage Report for them. This plugin can automate this process for you.

Maybe you plan to modernise an existing Salesforce implementation which exists as a source code repository but is still of the happy-soup kind of implementation, e.g. all customizations in one large implementation and deployments using the Metadata API for full or incremental deployments. Now you're planning to modularise this big implementation into several unlocked packages and ask yourself how much additional work you have to do for parts of the implementation that are not supported in unlocked packages. This plugin can provide you with a detailed list of components that are not supported by the targeted deployment mechanism. (To be clear, this plugin is not targeted at helping find the right componentisation of your implementation into individual unlocked packages).

## Installation into the Salesforce CLI

```bash
$ sfdx plugins:install https://github.com/mkreth/sfdx-metadata-coverage
```

## Issues

Please report any issues at https://github.com/mkreth/sfdx-metadata-coverage/issues

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

## License

MIT (c) Magnus Kreth
Licensed under the MIT license. For full license text, see file [LICENSE.txt](LICENSE.txt).
