/*
 * Copyright (c) 2023, Clay Chipps
 * All rights reserved.
 * Licensed under the MIT License.
 * For full license text, see LICENSE.md file in the repo root or https://opensource.org/licenses/MIT
 */

import path from 'node:path';
import { expect } from 'chai';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { Duration } from '@salesforce/kit';
import { PackageToInstall } from './../../../../../src/commands/chipps/package/dependencies/install.js';

describe('chipps package dependencies install', () => {
  let session: TestSession;

  before(async () => {
    session = await TestSession.create({
      devhubAuthStrategy: 'AUTO',
      project: {
        gitClone: 'https://github.com/ClayChipps/easy-spaces-lwc',
      },
      scratchOrgs: [
        {
          setDefault: true,
          config: path.join('config', 'project-scratch-def.json'),
        },
      ],
    });
  });

  after(async () => {
    await session?.clean();
  });

  it('should install package dependencies with stdout', () => {
    const username = [...session.orgs.keys()][0];
    const command = `chipps package dependencies install --install-type All --target-org ${username} --no-prompt`;
    const output = execCmd(command, { ensureExitCode: 0, timeout: Duration.minutes(30).milliseconds });
    const stdout = output?.shellOutput?.stdout;

    expect(stdout).to.contain('Installing package ESObjects@57.0.0-3... done');
    expect(stdout).to.contain('Installing package ESBaseCodeLWC@57.0.0-2... done');
    expect(stdout).to.contain('Installing package ESBaseStylesLWC@57.0.0-2... done');
  });

  it('should install package dependencies with json', () => {
    const username = [...session.orgs.keys()][0];
    const command = `chipps package dependencies install --install-type All --target-org ${username} --no-prompt`;
    const output = execCmd<PackageToInstall[]>(command, {
      ensureExitCode: 0,
      timeout: Duration.minutes(30).milliseconds,
    }).jsonOutput;

    expect(output!.result[0].PackageName).contains('ESObjects');
    expect(output!.result[1].PackageName).contains('ESBaseCodeLWC');
    expect(output!.result[2].PackageName).contains('ESBaseStylesLWC');
  });

  it('should skip installed packages with stdout', () => {
    const username = [...session.orgs.keys()][0];
    const command = `chipps package dependencies install --install-type Delta --target-org ${username} --no-prompt`;
    const output = execCmd(command, { ensureExitCode: 0, timeout: Duration.minutes(30).milliseconds });
    const stdout = output?.shellOutput?.stdout;

    expect(stdout).to.contain(
      'Package ESObjects@57.0.0-3 (04t4W000002nizdQAA) is already installed and will be skipped'
    );
    expect(stdout).to.contain(
      'Package ESBaseCodeLWC@57.0.0-2 (04t4W000002niziQAA) is already installed and will be skipped'
    );
    expect(stdout).to.contain(
      'Package ESBaseStylesLWC@57.0.0-2 (04t4W000002niznQAA) is already installed and will be skipped'
    );
  });

  it('should skip installed packages with json', () => {
    const username = [...session.orgs.keys()][0];
    const command = `chipps package dependencies install --install-type Delta --target-org ${username} --no-prompt`;
    const output = execCmd<PackageToInstall[]>(command, {
      ensureExitCode: 0,
      timeout: Duration.minutes(30).milliseconds,
    }).jsonOutput;

    expect(output!.result[0].Status).equals('Skipped');
    expect(output!.result[1].Status).equals('Skipped');
    expect(output!.result[2].Status).equals('Skipped');
  });
});
