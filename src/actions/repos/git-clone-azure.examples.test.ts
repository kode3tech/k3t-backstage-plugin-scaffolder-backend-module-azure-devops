
import { getVoidLogger } from '@backstage/backend-common';
import { ConfigReader } from '@backstage/config';
import { ScmIntegrations } from '@backstage/integration';
import os from 'os';
import { PassThrough } from 'stream';
import yaml from 'yaml';
import { createGitCloneFromAzureAction } from './git-clone-azure';
import { examples } from './git-clone-azure.examples';
import { GIT_CLONE_AZURE } from './ids';


describe(`${GIT_CLONE_AZURE} examples`, () => {
  // const addLocation = jest.fn();
  // const catalogClient = {
  //   addLocation: addLocation,
  // };

  const action = createGitCloneFromAzureAction({
    config: Symbol('ConfigReader') as unknown as ConfigReader,
    integrations: Symbol('Integrations') as unknown as ScmIntegrations
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
