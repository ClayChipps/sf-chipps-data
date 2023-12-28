/*
 * Copyright (c) 2023, Clay Chipps
 * All rights reserved.
 * Licensed under the MIT License.
 * For full license text, see LICENSE.md file in the repo root or https://opensource.org/licenses/MIT
 */

import { MockTestOrgData, TestContext } from '@salesforce/core/lib/testSetup.js';

describe('chipps package dependencies install', () => {
  const $$ = new TestContext();
  const testOrg = new MockTestOrgData();

  before(async () => {
    await $$.stubAuths(testOrg);
  });

  afterEach(() => {
    $$.restore();
  });
});
