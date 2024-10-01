import { coreServices, createBackendModule } from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';

import {
  createGitCloneFromAzureAction,
  createGitCommitFromAzureAction,
  createPipelineCreateAzureAction
} from './actions';

import {
  ScmIntegrations,
} from '@backstage/integration';


/**
 * A backend module that registers the action into the scaffolder
 */
export const scaffolderCatalogModule = createBackendModule({
  moduleId: 'k3tech:scaffolder-actions-azure-devops',
  pluginId: 'scaffolder',
  register({ registerInit }) {
    registerInit({
      deps: {
        scaffolderActions: scaffolderActionsExtensionPoint,
        config: coreServices.rootConfig,
        logger: coreServices.rootLogger
      },
      async init({ scaffolderActions, config, logger}) {
        const integrations = ScmIntegrations.fromConfig(config);
      
        scaffolderActions.addActions(
          createPipelineCreateAzureAction({config, integrations, logger}),
          createGitCloneFromAzureAction({config, integrations}),
          createGitCommitFromAzureAction({config}),
        );
      }
    });
  },
})
