/*
 * Copyright (c) 2023, Clay Chipps
 * All rights reserved.
 * Licensed under the MIT License.
 * For full license text, see LICENSE.md file in the repo root or https://opensource.org/licenses/MIT
 */

import nock from 'nock';
import { expect } from 'chai';
import { Connection, SfError } from '@salesforce/core';
import { MockTestOrgData, TestContext } from '@salesforce/core/lib/testSetup.js';
import DataFileUpload from '../../../../../src/commands/chipps/data/file/upload.js';

describe('chipps data file upload', () => {
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
      await DataFileUpload.run();
      expect.fail('should have thrown NoDefaultEnvError');
    } catch (err) {
      const error = err as SfError;
      expect(error.name).to.equal('NoDefaultEnvError');
      expect(error.message).to.include('Use -o or --target-org to specify an environment.');
    }
  });

  it('should return content version successfully', async () => {
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

    const response = await DataFileUpload.run([
      '--file-path',
      'package.json',
      '--title',
      'coolFile',
      '--target-org',
      testOrg.username,
    ]);

    expect(response.Name).to.equal('coolFile');
    expect(response.Title).to.equal('coolFile');
    expect(response.FileExtension).to.equal('.json');
  });
});
