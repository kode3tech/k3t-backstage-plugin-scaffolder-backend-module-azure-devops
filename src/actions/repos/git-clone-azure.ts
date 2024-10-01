
import { Git } from '@backstage/backend-common';
import { Config } from '@backstage/config';
import { getRepoSourceDirectory, parseRepoUrl } from '../utils';

import { ScmIntegrations } from '@backstage/integration';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { JsonObject } from '@backstage/types';
import { Schema } from 'jsonschema';
import { Logger } from 'winston';
import { examples } from './git-clone-azure.examples';
import { GIT_CLONE_AZURE } from './ids';

export type FieldsType = {
  repoUrl: string
  targetPath?: string;
  fromRef?: string;
} & JsonObject;


export const FieldsSchema: Schema = {
  type: 'object',
  properties: {
    repoUrl: {
      title: 'RepoUrl',
      description: 'Repo Url to be parsed with parseRepoUrl',
      type: 'string',
    },
    fromRef: {
      title: 'Git references, can be branch, tag or commit id',
      // default: 'master',
      description: 'Git references to checkout after clone repository, default is \'master\'.',
      type: 'string',
    },
    targetPath: {
      title: 'Relative path on workspace path to store repository contents, default is \'./\'.',
      // default: './',
      type: 'string',
    }
  },
}

export const InputSchema: Schema = {
  type: 'object',
  properties: {
    commonParams: FieldsSchema,
    params: {
      type: 'array',
      items: FieldsSchema
    }
  }
}

export type InputType = {
  commonParams?: Partial<FieldsType>,
  params: FieldsType[]
}

export type OutputFields = Array<any>


export type OutputType = {
  results: OutputFields
}

export const OutputSchema: Schema = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: { 
        type: "object"
      },
    }
  }
}

export function createGitCloneFromAzureAction(options: {
  config: Config;
  integrations: ScmIntegrations
}) {
  const {
    config,
    integrations,
  } = options;
  const AZURE_DEVOPS_TOKEN = config.getConfigArray('integrations.azure')[0].getString('token');
  
  return createTemplateAction<InputType, OutputType>({
    id: GIT_CLONE_AZURE,
    description: 'Clone and Checkout content from an Azure DevOps Git Repository',
    examples,
    schema: {
      input: InputSchema,
      output: OutputSchema,
    },
    async handler(ctx) {
      const {input: { params: values, commonParams: commonValues }, logger, output} = ctx
      
      const results = [];

      for (const value of values) {
        const input: FieldsType = {
          ...{...(commonValues ?? {}), ...value}
        }
        const { repoUrl }  = input;
        
        logger.info(`Cloning from '${repoUrl}'...`)

        const dir = await clone({
          input,
          logger,
          workspacePath: ctx.workspacePath,
          integrations,
          AZURE_DEVOPS_TOKEN
        });

        results.push(dir)
      }
      output('results', results);
    },
  });
}
async function clone({
  input: {fromRef = 'master', repoUrl, targetPath},
  integrations,
  logger,
  AZURE_DEVOPS_TOKEN,
  workspacePath
}: {
  input: FieldsType, 
  logger: Logger, 
  integrations: ScmIntegrations, 
  AZURE_DEVOPS_TOKEN: string,
  workspacePath: string
}) {

  const {
    host, repo: repoName, organization: repoOrg, owner: repoOwner, project: repoProject
  } = parseRepoUrl(repoUrl, integrations);

  const remoteUrl = `https\:\/\/${host}/${repoOrg}/${(repoProject ?? repoOwner)}/_git/${repoName}`;


  logger.info(`RepoUrl '${remoteUrl}'`);

  const dir = getRepoSourceDirectory(workspacePath, targetPath);

  logger.info(`repo dir: ${dir}`);

  const _git = Git.fromAuth({
    username: 'oauth2',
    password: AZURE_DEVOPS_TOKEN,
    logger,
  });

  logger.info(`Cloning from...`);
  logger.info(`  uri: ${remoteUrl}`);
  logger.info(`  branch/tag/commit: ${fromRef}`);
  logger.info(`  into: ${dir}`);

  const url = remoteUrl;

  await _git.clone({ url, dir, ref: fromRef, depth: 1 });
  await _git.fetch({ dir });
  return dir;
}

