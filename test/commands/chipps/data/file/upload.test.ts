/*
 * Copyright (c) 2024, Clay Chipps; Copyright (c) 2024, Salesforce.com, Inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { expect } from 'chai';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
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
    const server = setupServer(
      http.post(`${(await testOrg.getConnection()).baseUrl()}/sobjects/ContentVersion`, () =>
        HttpResponse.json([{ id: '123', success: true }])
      )
    );
    server.listen();

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

    server.close();
  });
});
