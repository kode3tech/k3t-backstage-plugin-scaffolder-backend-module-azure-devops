/*
 * Copyright 2024 The K3tech Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { getVoidLogger } from '@backstage/backend-common';
import { ConfigReader } from '@backstage/config';
import { ScmIntegrations } from '@backstage/integration';
import os from 'os';
import { PassThrough } from 'stream';
import { Logger } from 'winston';
import { PIPELINE_CREATE_AZURE } from './ids';
import { createPipelineCreateAzureAction } from './pipeline-create-azure';

describe(`${PIPELINE_CREATE_AZURE}`, () => {

  // const addLocation = jest.fn();
  // const catalogClient = {
  //   addLocation: addLocation,
  // };

  // const integrations = ScmIntegrations.fromConfig(
  //   new ConfigReader({
  //     integrations: {
  //       azure: [{ host: 'dev.azure.com', token: 'token' }],
  //     },
  //   }),
  // );

  const action = createPipelineCreateAzureAction({
    logger: Symbol('Logger') as unknown as Logger,
    integrations: Symbol('ScmIntegrations') as unknown as ScmIntegrations,
    config: Symbol('ConfigReader') as unknown as ConfigReader,
  });

  const mockContext = {
    workspacePath: os.tmpdir(),
    logger: getVoidLogger(),
    logStream: new PassThrough(),
    output: jest.fn(),
    createTemporaryDirectory: jest.fn(),
  };
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should reject registrations for locations that does not match any integration', async () => {
    await expect(
      action.handler({
        ...mockContext,
        input: {
          commonParams: {
            defaultBranch: 'ref/heads/main',
            pipelinePath: 'my-microsservices',
            yamlFilename: '.azure-pipeline.yaml',
          },
          params: [{
            repoUrl: './repo-1',
            pipelineName: 'repo-1',
          },
          {
            repoUrl: './repo-2',
            pipelineName: 'repo-2',
          }]
        },
      }),
    ).rejects.toThrow(
      /No integration found for host https:\/\/google.com\/foo\/bar/,
    );
  });

});
