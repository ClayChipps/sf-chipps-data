/*
 * Copyright (c) 2024, Clay Chipps; Copyright (c) 2024, Salesforce.com, Inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fs from 'node:fs';
import { parse } from 'csv-parse';
import nock from 'nock';
import { expect } from 'chai';
import { Connection, SfError } from '@salesforce/core';
import { MockTestOrgData, TestContext } from '@salesforce/core/lib/testSetup.js';
import DataFilesUpload from '../../../../../src/commands/chipps/data/files/upload.js';

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
    nock(testOrg.instanceUrl)
      .post('/services/data/v42.0/sobjects/ContentVersion')
      .reply(200, { id: '123', success: true })
      .persist();

    $$.SANDBOX.stub(Connection.prototype, 'singleRecordQuery').resolves({
      Id: '123',
      ContentDocumentId: '123',
      FileExtension: '.json',
      Name: 'coolFile',
      Title: 'coolFile',
    });

    await DataFilesUpload.run([
      '--file-path',
      './test/test-files/chipps.data.files.upload.csv',
      '--target-org',
      testOrg.username,
    ]);

    const errorResults = parse(fs.readFileSync('error.csv'), { bom: true, columns: true });
    const successResults = parse(fs.readFileSync('success.csv'), { bom: true, columns: true });

    expect(errorResults).to.contain('RequestError: ENOENT: no such file or directory');
    expect(successResults).to.deep.equal([
      { PathOnClient: 'test\test-files\basicTextFile.txt', Title: 'Basic Text File', ContentDocumentId: 123 },
      { PathOnClient: 'test\test-fileswatchDoge.jpg', Title: 'Watch Doges', ContentDocumentId: 123 },
    ]);
  });
});
