
import { getVoidLogger } from '@backstage/backend-common';
import { ConfigReader } from '@backstage/config';
import { ScmIntegrations } from '@backstage/integration';
import os from 'os';
import { PassThrough } from 'stream';
import { Logger } from 'winston';
import yaml from 'yaml';
import { PIPELINE_CREATE_AZURE } from './ids';
import { createPipelineCreateAzureAction } from './pipeline-create-azure';
import { examples } from './pipeline-create-azure.examples';
import { ActionContext } from '@backstage/plugin-scaffolder-node';


describe(`${PIPELINE_CREATE_AZURE} examples`, () => {
  // const addLocation = jest.fn();
  // const catalogClient = {
  //   addLocation: addLocation,
  // };

  const action = createPipelineCreateAzureAction({
    logger: Symbol('logger') as unknown as Logger,
    config: Symbol('ConfigReader') as unknown as ConfigReader,
    integrations: Symbol('Integrations') as unknown as ScmIntegrations
  });

  const mockContext: ActionContext<any, any> = {
    input: {},
    checkpoint: jest.fn(),
    getInitiatorCredentials: jest.fn(),
    workspacePath: os.tmpdir(),
    logger: getVoidLogger(),
    logStream: new PassThrough(),
    output: jest.fn(),
    createTemporaryDirectory: jest.fn(),
  };
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should register location in catalog', async () => {
    // addLocation
    //   .mockResolvedValueOnce({
    //     entities: [],
    //   })
    //   .mockResolvedValueOnce({
    //     entities: [
    //       {
    //         metadata: {
    //           namespace: 'default',
    //           name: 'test',
    //         },
    //         kind: 'Component',
    //       } as Entity,
    //     ],
    //   });
    await action.handler({
      ...mockContext,
      input: yaml.parse(examples[0].example).steps[0].input,
    });

    // expect(addLocation).toHaveBeenNthCalledWith(
    //   1,
    //   {
    //     type: 'url',
    //     target:
    //       'http://github.com/backstage/backstage/blob/master/catalog-info.yaml',
    //   },
    //   {},
    // );
    // expect(addLocation).toHaveBeenNthCalledWith(
    //   2,
    //   {
    //     dryRun: true,
    //     type: 'url',
    //     target:
    //       'http://github.com/backstage/backstage/blob/master/catalog-info.yaml',
    //   },
    //   {},
    // );

    expect(mockContext.output).toHaveBeenCalledWith(
      'entityRef',
      'component:default/test',
    );
    expect(mockContext.output).toHaveBeenCalledWith(
      'catalogInfoUrl',
      'http://github.com/backstage/backstage/blob/master/catalog-info.yaml',
    );
  });
});
