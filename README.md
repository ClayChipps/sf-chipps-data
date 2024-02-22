# sf-chipps-data

[![NPM](https://img.shields.io/npm/v/sf-chipps-data.svg?label=sf-chipps-data)](https://npmjs.com/package/sf-chipps-data) [![Downloads/week](https://img.shields.io/npm/dw/sf-chipps-data.svg)](https://npmjs.com/package/sf-chipps-data) [![Known Vulnerabilities](https://snyk.io/test/github/ClayChipps/sf-chipps-data/badge.svg)](https://snyk.io/test/github/ClayChipps/sf-chipps-data) [![License: BSD-3-Clause](https://img.shields.io/badge/License-BSD_3--Clause-yellow.svg)](https://raw.githubusercontent.com/ClayChipps/sf-chipps-data/main/LICENSE.txt)

## Install

```bash
sf plugins install sf-chipps-data
```

## Issues

Please report any issues at https://github.com/ClayChipps/sf-chipps-data/issues

## Contributing

1. Please read our [Code of Conduct](CODE_OF_CONDUCT.md)
2. Create a new issue before starting your project so that we can keep track of
   what you are trying to add/fix. That way, we can also offer suggestions or
   let you know if there is already an effort in progress.
3. Fork this repository.
4. [Build the plugin locally](#build)
5. Create a _topic_ branch in your fork. Note, this step is recommended but technically not required if contributing using a fork.
6. Edit the code in your fork.
7. Write appropriate tests for your changes. Try to achieve at least 95% code coverage on any new code. No pull request will be accepted without unit tests.
8. Send us a pull request when you are done. We'll review your code, suggest any needed changes, and merge it in.

### Build

To build the plugin locally, make sure to have yarn installed and run the following commands:

```bash
# Clone the repository
git clone git@github.com:ClayChipps/sf-chipps-data

# Install the dependencies and compile
yarn && yarn build
```

To use your plugin, run using the local `./bin/dev` or `./bin/dev.cmd` file.

```bash
# Run using local run file.
./bin/dev.cmd chipps data
```

There should be no differences when running via the Salesforce CLI or using the local run file. However, it can be useful to link the plugin to do some additional testing or run your commands from anywhere on your machine.

```bash
# Link your plugin to the sf cli
sf plugins link .
# To verify
sf plugins
```

## Commands

<!-- commands -->
* [`sf chipps data file upload`](#sf-chipps-data-file-upload)
* [`sf chipps data files upload`](#sf-chipps-data-files-upload)

## `sf chipps data file upload`

Upload a file to a Salesforce org.

```
USAGE
  $ sf chipps data file upload --file-path <value> -o <value> [--json] [--api-version <value>] [--first-publish-location-id
    <value>] [--title <value>]

FLAGS
  -o, --target-org=<value>                 (required) Username or alias of the target org. Not required if the
                                           `target-org` configuration variable is already set.
      --api-version=<value>                Override the api version used for api requests made by this command
      --file-path=<value>                  (required) Path to the file to upload.
      --first-publish-location-id=<value>  Specify a record Id that the file should be linked to.
      --title=<value>                      Specify the title for the file being uploaded.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Upload a file to a Salesforce org.

  Uploads a file to a Salesforce org.

EXAMPLES
  $ sf chipps data file upload --file-path fileToUpload.txt --target-org myTargetOrg

  $ sf chipps data file upload --file-path fileToUpload.txt --first-publish-location-id 0019000000DmehK --target-org myTargetOrg
```

_See code: [src/commands/chipps/data/file/upload.ts](https://github.com/ClayChipps/sf-chipps-data/blob/0.7.1/src/commands/chipps/data/file/upload.ts)_

## `sf chipps data files upload`

Upload files to a Salesforce org.

```
USAGE
  $ sf chipps data files upload --file-path <value> -o <value> [--json] [--api-version <value>] [--max-parallel-jobs
  <value>]

FLAGS
  -o, --target-org=<value>         (required) Username or alias of the target org. Not required if the `target-org`
                                   configuration variable is already set.
      --api-version=<value>        Override the api version used for api requests made by this command
      --file-path=<value>          (required) Path to the csv file that specifies the upload.
      --max-parallel-jobs=<value>  [default: 1] Maximum number of parallel jobs.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Upload files to a Salesforce org.

  Uploads files specified by a csv to a Salesforce org. By default, the plugin uses the REST API for the upload as the
  Bulk API is limited in its payload size. This means that each file will use one REST API request.

EXAMPLES
  $ sf chipps data files upload --file-path filesToUpload.csv --target-org myTargetOrg

  $ sf chipps data files upload --file-path filesToUpload.csv --max-parallel-jobs 5 --target-org myTargetOrg

FLAG DESCRIPTIONS
  --file-path=<value>  Path to the csv file that specifies the upload.

    The csv file must specify the columns PathOnClient and Title. Optionally, a FirstPublishLocationId can be specified
    to have it linked directly to a Salesforce record after upload.

  --max-parallel-jobs=<value>  Maximum number of parallel jobs.

    By default the plugin will only process a single file upload at a time. You can increase this value to allow for
    quasi concurrent uploads. Please note that setting this value too high can cause performance issues.
```

_See code: [src/commands/chipps/data/files/upload.ts](https://github.com/ClayChipps/sf-chipps-data/blob/0.7.1/src/commands/chipps/data/files/upload.ts)_
<!-- commandsstop -->
