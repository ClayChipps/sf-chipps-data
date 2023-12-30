# sf-chipps-data

[![NPM](https://img.shields.io/npm/v/sf-chipps-data.svg?label=sf-chipps-data)](https://www.npmjs.com/data/sf-chipps-data) [![Downloads/week](https://img.shields.io/npm/dw/sf-chipps-data.svg)](https://npmjs.org/data/sf-chipps-data) [![Known Vulnerabilities](https://snyk.io/test/github/ClayChipps/sf-chipps-data/badge.svg)](https://snyk.io/test/github/ClayChipps/sf-chipps-data) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/salesforcecli/sf-chipps-data/main/LICENSE.txt)

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

<!-- commandsstop -->
