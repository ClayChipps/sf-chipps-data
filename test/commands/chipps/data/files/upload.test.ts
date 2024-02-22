/*
 * Copyright (c) 2024, Clay Chipps; Copyright (c) 2024, Salesforce.com, Inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fs from 'node:fs';
import { expect } from 'chai';
import { parse } from 'csv-parse/sync';
import got from 'got';
import { Connection, SfError } from '@salesforce/core';
import { MockTestOrgData, TestContext } from '@salesforce/core/lib/testSetup.js';
import DataFilesUpload from '../../../../../src/commands/chipps/data/files/upload.js';
import { ContentVersionToUpload } from '../../../../../src/common/contentVersionTypes.js';

describe('chipps data files upload', () => {
  const $$ = new TestContext();
  const testOrg = new MockTestOrgData();

  beforeEach(async () => {
    await $$.stubAuths(testOrg);
  });

  afterEach(() => {
    $$.restore();
  });

  it('should error without required --target-org flag', async () => {
    try {
      await DataFilesUpload.run();
      expect.fail('should have thrown NoDefaultEnvError');
    } catch (err) {
      const error = err as SfError;
      expect(error.name).to.equal('NoDefaultEnvError');
      expect(error.message).to.include('Use -o or --target-org to specify an environment.');
    }
  });

  it('should write results to csv', async () => {
    $$.SANDBOX.stub(got, 'post').resolves({ id: '123', success: true });

    $$.SANDBOX.stub(Connection.prototype, 'singleRecordQuery').resolves({
      Id: '123',
      ContentDocumentId: '123',
      FileExtension: '.json',
      Title: 'coolFile',
    });

    await DataFilesUpload.run([
      '--file-path',
      './test/test-files/chipps.data.files.upload.csv',
      '--target-org',
      testOrg.username,
    ]);

    const errorResults = parse(fs.readFileSync('error.csv'), { bom: true, columns: true }) as ContentVersionToUpload[];
    const successResults = parse(fs.readFileSync('success.csv'), {
      bom: true,
      columns: true,
    }) as ContentVersionToUpload[];

    expect(errorResults[0].Error).to.contain('Error: ENOENT: no such file or directory');
    expect(successResults).to.deep.equal([
      {
        ContentDocumentId: '123',
        FirstPublishLocationId: '',
        PathOnClient: 'test/test-files/basicTextFile.txt',
        Title: 'Basic Text File',
      },
      {
        ContentDocumentId: '123',
        FirstPublishLocationId: '',
        PathOnClient: 'test/test-files/watchDoge.jpg',
        Title: 'Watch Doges',
      },
    ]);
  });
});
