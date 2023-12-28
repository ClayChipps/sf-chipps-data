/*
 * Copyright (c) 2023, Clay Chipps
 * All rights reserved.
 * Licensed under the MIT License.
 * For full license text, see LICENSE.md file in the repo root or https://opensource.org/licenses/MIT
 */

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { AuthInfo, Connection, Messages, Lifecycle, PackageDirDependency, SfError } from '@salesforce/core';
import { Duration } from '@salesforce/kit';
import { parse } from 'csv-parse';


Messages.importMessagesDirectory(dirname(fileURLToPath(import.meta.url)));
const messages = Messages.loadMessages('sf-chipps-data', 'chipps.data.files.upload');

export default class DataFilesUpload extends SfCommand<string> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'api-version': Flags.orgApiVersion(),
    'file-path': Flags.directory({ required: true }),
    'target-org': Flags.requiredOrg(),
  };

  public async run(): Promise<string> {
    const { flags } = await this.parse(DataFilesUpload);

    // Authorize to the target org
    const targetOrgConnection = flags['target-org']?.getConnection(flags['api-version']);

    if (!targetOrgConnection) {
      throw messages.createError('error.targetOrgConnectionFailed');
    }

    const csvFilePath = flags['file-path'];

    this.spinner.start('Reading csv file', '', { stdout: true });

    let filesToUpload = await this.readFile(csvFilePath);


    private async readFile(filePath: string): Promise<any> {
      const csv = require("csv-parser");
      const fs = require("fs");
      let rows = [];

      return new Promise<any>((resolve) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (data) => {
            rows.push(data);
          })
          .on("end", () => {
            resolve(rows);
          });
      });
    }

    // Validate minimum api version
    const apiVersion = parseInt(targetOrgConnection.getApiVersion(), 10);
    if (apiVersion < 36) {
      throw messages.createError('error.apiVersionTooLow');
    }

    // Introspect the project to find dependencies
    const project = this.project;

    let packagesToInstall: PackageToInstall[] = [];
    const packageInstallRequests: PackageInstallRequest[] = [];
    const dependenciesForDevHubResolution: PackageDirDependency[] = [];

    const packageAliases = project.getPackageAliases();
    const packageDirectories = project.getPackageDirectories();

    this.spinner.start('Analyzing project to determine packages to install', '', { stdout: true });

    for (const packageDirectory of packageDirectories) {
      const dependencies = packageDirectory?.dependencies ?? [];

      for (const dependency of dependencies) {
        const pakage = dependency.package; // 'package' is a restricted word in safe mode
        const versionNumber = dependency.versionNumber;

        if (pakage && versionNumber) {
          // This must be resolved by a dev hub
          dependenciesForDevHubResolution.push(dependency);
          continue;
        }

        // Assume the package is not an alias
        let packageVersionId = pakage;

        // If we found the alias, then use that value as the packageVersionId
        if (packageAliases?.[packageVersionId]) {
          packageVersionId = packageAliases?.[packageVersionId] as string;
        }

        if (!isPackageVersionId(packageVersionId)) {
          throw messages.createError('error.noSubscriberPackageVersionId');
        }

        packagesToInstall.push({
          Status: '',
          PackageName: pakage,
          SubscriberPackageVersionId: packageVersionId,
        } as PackageToInstall);
      }
    }

    this.spinner.stop();

    if (dependenciesForDevHubResolution.length > 0) {
      this.spinner.start('Resolving package versions from dev hub', '', { stdout: true });

      if (!flags['target-dev-hub']) {
        throw messages.createError('error.devHubMissing');
      }

      // Initialize the authorization for the provided dev hub
      const targetDevHubAuthInfo = await AuthInfo.create({ username: flags['target-dev-hub'] });

      // Create a connection to the dev hub
      const targetDevHubConnection = await Connection.create({ authInfo: targetDevHubAuthInfo });

      if (!targetDevHubConnection) {
        throw messages.createError('error.targetDevHubConnectionFailed');
      }

      for (const dependencyForDevHubResolution of dependenciesForDevHubResolution) {
        const pakage = dependencyForDevHubResolution.package; // 'package' is a restricted word in safe mode
        const versionNumber = dependencyForDevHubResolution.versionNumber;

        if (!pakage || !versionNumber) {
          continue;
        }

        // Assume the package is not an alias
        let packageVersionId = pakage;

        // If we found the alias, then use that value as the packageVersionId
        if (packageAliases?.[packageVersionId]) {
          packageVersionId = packageAliases?.[packageVersionId] as string;
        }

        packageVersionId = await resolvePackageVersionId(pakage, versionNumber, flags.branch, targetDevHubConnection);

        packagesToInstall.push({
          PackageName: pakage,
          Status: '',
          SubscriberPackageVersionId: packageVersionId,
        } as PackageToInstall);
      }

      this.spinner.stop();
    }

    // Filter out duplicate packages before we start the install process
    this.spinner.start('Checking for duplicate package dependencies', '', { stdout: true });
    packagesToInstall = packagesToInstall.filter(
      (packageToInstall, index, self) =>
        index === self.findIndex((t) => t.SubscriberPackageVersionId === packageToInstall?.SubscriberPackageVersionId)
    );
    this.spinner.stop();

    // If we have packages, begin the install process
    if (packagesToInstall?.length > 0) {
      let installedPackages: InstalledPackages[] = [];

      // If precheck is enabled, get the currently installed packages
      if (installType[flags['install-type']] === installType.Delta) {
        this.spinner.start('Analyzing which packages to install', '', { stdout: true });
        installedPackages = await SubscriberPackageVersion.installedList(targetOrgConnection);
        this.spinner.stop();
      }

      // Process any installation keys for the packages
      const installationKeyMap = new Map<string, string>();

      if (flags['installation-key']) {
        this.spinner.start('Processing package installation keys', '', { stdout: true });
        for (let installationKey of flags['installation-key']) {
          installationKey = installationKey.trim();

          const isKeyValid = installationKeyRegex.test(installationKey);

          if (!isKeyValid) {
            throw messages.createError('error.installationKeyFormat');
          }

          const installationKeyPair = installationKey.split(':');
          let packageId = installationKeyPair[0];
          const packageKey = installationKeyPair[1];

          // Check if the key is an alias
          if (packageAliases?.[packageId]) {
            // If it is, get the id for the package
            packageId = packageAliases?.[packageId] as string;
          }

          installationKeyMap.set(packageId, packageKey);
        }
        this.spinner.stop();
      }

      this.spinner.start('Installing dependent packages', '', { stdout: true });

      for (const packageToInstall of packagesToInstall) {
        let installationKey = '';

        if (installType[flags['install-type']] === installType.Delta) {
          if (isPackageVersionInstalled(installedPackages, packageToInstall?.SubscriberPackageVersionId)) {
            const packageName = packageToInstall?.PackageName;
            const subscriberPackageVersionId = packageToInstall?.SubscriberPackageVersionId;

            packageToInstall.Status = 'Skipped';
            this.log(`Package ${packageName} (${subscriberPackageVersionId}) is already installed and will be skipped`);

            continue;
          }
        }

        // Check if we have an installation key for this package
        if (installationKeyMap.has(packageToInstall?.SubscriberPackageVersionId)) {
          // If we do, set the installation key value
          installationKey = installationKeyMap.get(packageToInstall?.SubscriberPackageVersionId) ?? '';
        }

        this.spinner.start(`Preparing package ${packageToInstall.PackageName}`, '', { stdout: true });

        this.subscriberPackageVersion = new SubscriberPackageVersion({
          connection: targetOrgConnection,
          aliasOrId: packageToInstall?.SubscriberPackageVersionId,
          password: installationKey,
        });

        const request: PackageInstallCreateRequest = {
          SubscriberPackageVersionKey: await this.subscriberPackageVersion.getId(),
          Password: installationKey,
          ApexCompileType: flags['apex-compile'],
          SecurityType: securityType[flags['security-type']] as PackageInstallCreateRequest['SecurityType'],
          SkipHandlers: flags['skip-handlers']?.join(','),
          UpgradeType: upgradeType[flags['upgrade-type']] as PackageInstallCreateRequest['UpgradeType'],
        };

        // eslint-disable-next-line @typescript-eslint/require-await
        Lifecycle.getInstance().on(PackageEvents.install.warning, async (warningMsg: string) => {
          this.warn(warningMsg);
        });

        this.spinner.stop();

        if (flags['publish-wait']?.milliseconds > 0) {
          let timeThen = Date.now();
          // waiting for publish to finish
          let remainingTime = flags['publish-wait'];

          Lifecycle.getInstance().on(
            PackageEvents.install['subscriber-status'],
            // eslint-disable-next-line @typescript-eslint/require-await
            async (publishStatus: PackagingSObjects.InstallValidationStatus) => {
              const elapsedTime = Duration.milliseconds(Date.now() - timeThen);
              timeThen = Date.now();
              remainingTime = Duration.milliseconds(remainingTime.milliseconds - elapsedTime.milliseconds);
              const status =
                publishStatus === 'NO_ERRORS_DETECTED'
                  ? messages.getMessage('info.availableForInstallation')
                  : messages.getMessage('info.unavailableForInstallation');
              this.spinner.start(
                messages.getMessage('info.packagePublishWaitingStatus', [remainingTime.minutes, status]),
                '',
                { stdout: true }
              );
            }
          );

          this.spinner.start(
            messages.getMessage('info.packagePublishWaitingStatus', [remainingTime.minutes, 'Querying Status']),
            '',
            { stdout: true }
          );

          await this.subscriberPackageVersion.waitForPublish({
            publishTimeout: flags['publish-wait'],
            publishFrequency: Duration.seconds(10),
            installationKey,
          });

          // need to stop the spinner to avoid weird behavior with the prompts below
          this.spinner.stop();
        }

        // If the user has specified --upgradetype Delete, then prompt for confirmation
        // unless the noprompt option has been included.
        if (flags['upgrade-type'] === 'Delete') {
          if ((await this.subscriberPackageVersion.getPackageType()) === 'Unlocked' && !flags['no-prompt']) {
            const promptMsg = messages.getMessage('prompt.upgradeType');
            if (!(await this.confirm(promptMsg))) {
              throw messages.createError('info.canceledPackageInstall');
            }
          }
        }

        // If the package has external sites, ask the user for permission to enable them
        // unless the noprompt option has been included.
        const extSites = await this.subscriberPackageVersion.getExternalSites();
        if (extSites) {
          let enableRss = true;
          if (!flags['no-prompt']) {
            const promptMsg = messages.getMessage('prompt.enableRss', [extSites.join('\n')]);
            enableRss = await this.confirm(promptMsg);
          }
          if (enableRss) {
            request.EnableRss = enableRss;
          }
        }

        let installOptions: Optional<PackageInstallOptions>;
        if (flags.wait) {
          installOptions = {
            pollingTimeout: flags.wait,
            pollingFrequency: Duration.seconds(2),
          };
          let remainingTime = flags.wait;
          let timeThen = Date.now();

          // waiting for package install to finish
          Lifecycle.getInstance().on(
            PackageEvents.install.status,
            // eslint-disable-next-line @typescript-eslint/require-await
            async (piRequest: PackageInstallRequest) => {
              const elapsedTime = Duration.milliseconds(Date.now() - timeThen);
              timeThen = Date.now();
              remainingTime = Duration.milliseconds(remainingTime.milliseconds - elapsedTime.milliseconds);
              this.spinner.status = messages.getMessage('info.packageInstallWaitingStatus', [
                remainingTime.minutes,
                piRequest.Status,
              ]);
            }
          );
        }

        let pkgInstallRequest: Optional<PackageInstallRequest>;
        try {
          this.spinner.start(`Installing package ${packageToInstall.PackageName}`, '', { stdout: true });
          pkgInstallRequest = await this.subscriberPackageVersion.install(request, installOptions);
          this.spinner.stop();
        } catch (error: unknown) {
          if (error instanceof SfError && error.data) {
            pkgInstallRequest = error.data as PackageInstallRequest;
            this.spinner.stop(messages.getMessage('error.packageInstallPollingTimeout'));
          } else {
            throw error;
          }
        } finally {
          if (pkgInstallRequest) {
            if (pkgInstallRequest.Status === 'SUCCESS') {
              packageToInstall.Status = 'Installed';
              packageInstallRequests.push(pkgInstallRequest);
            } else if (['IN_PROGRESS', 'UNKNOWN'].includes(pkgInstallRequest.Status)) {
              packageToInstall.Status = 'Installing';
              throw messages.createError('error.packageInstallInProgress', [
                this.config.bin,
                pkgInstallRequest.Id,
                targetOrgConnection.getUsername() as string,
              ]);
            } else {
              packageToInstall.Status = 'Failed';
              throw messages.createError('error.packageInstall', [
                reducePackageInstallRequestErrors(pkgInstallRequest),
              ]);
            }
          }
        }
      }
    } else {
      this.log('No packages were found to install');
    }

    return packagesToInstall;
  }
}
