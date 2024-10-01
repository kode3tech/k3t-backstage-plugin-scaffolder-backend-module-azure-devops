
import { CatalogApi } from '@backstage/catalog-client';
import { Config } from '@backstage/config';
import {
  ScmIntegrations,
} from '@backstage/integration';
import { TemplateAction, TemplateFilter, TemplateGlobal } from '@backstage/plugin-scaffolder-node';
import {
  createGitCloneFromAzureAction,
} from './repos';

import {
  createPipelineCreateAzureAction,
} from './piepline';
import { Logger } from 'winston';
import { UrlReaderService } from '@backstage/backend-plugin-api';

/**
 * The options passed to {@link createBuiltinActions}
 * @public
 */
export interface CreateAzureDevOpsActionsOptions {
  /**
   * The {@link @backstage/backend-common#UrlReader} interface that will be used in the default actions.
   */
  reader: UrlReaderService;
  /**
   * The {@link @backstage/integrations#ScmIntegrations} that will be used in the default actions.
   */
  integrations: ScmIntegrations;
  /**
   * The {@link @backstage/catalog-client#CatalogApi} that will be used in the default actions.
   */
  catalogClient: CatalogApi;
  /**
   * The {@link @backstage/config#Config} that will be used in the default actions.
   */
  config: Config;
  /**
   * The {@link winston#Logger} that will be used in the default actions.
   */
  logger: Logger;
  
  /**
   * Additional custom filters that will be passed to the nunjucks template engine for use in
   * Template Manifests and also template skeleton files when using `fetch:template`.
   */
  additionalTemplateFilters?: Record<string, TemplateFilter>;
  additionalTemplateGlobals?: Record<string, TemplateGlobal>;
}

/**
 * A function to generate create a list of default actions that the scaffolder provides.
 * Is called internally in the default setup, but can be used when adding your own actions or overriding the default ones
 *
 * @public
 * @returns A list of actions that can be used in the scaffolder
 */
export const createAzureDevOpsActions = (
  options: CreateAzureDevOpsActionsOptions,
): TemplateAction[] => {

  const actions = [
    createGitCloneFromAzureAction(options),
    createPipelineCreateAzureAction(options),
  ];

  return actions as TemplateAction<any, any>[];
};
