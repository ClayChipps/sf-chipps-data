/*
 * Copyright (c) 2024, Clay Chipps; Copyright (c) 2024, Salesforce.com, Inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'node:path';
import { expect } from 'chai';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { Duration } from '@salesforce/kit';
import { ContentVersion } from './../../../../../src/common/contentVersionTypes.js';

describe('chipps data files upload', () => {
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

  it('should upload content version', () => {
    const username = [...session.orgs.keys()][0];
    const command = `chipps data file upload --file-path docs/upload_icon.png --target-org ${username}`;
    const output = execCmd<ContentVersion>(command, {
      ensureExitCode: 0,
      timeout: Duration.minutes(30).milliseconds,
    }).jsonOutput;

    expect(output!.result.FileExtension).equals('png');
    expect(output!.result.Title).equals('upload_icon.png');
  });
});
