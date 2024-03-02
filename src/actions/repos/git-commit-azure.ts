
import { Git } from '@backstage/backend-common';
import { Config } from '@backstage/config';
import { getRepoSourceDirectory } from '../utils';

import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { JsonObject } from '@backstage/types';
import { Schema } from 'jsonschema';
import { Logger } from 'winston';
import { examples } from './git-commit-azure.examples';
import { parseEntityRef } from '@backstage/catalog-model';
import git from 'isomorphic-git';

import fs from 'node:fs';
import { GIT_COMMIT_AZURE } from './ids';

export type FieldsType = {
  targetPath?: string;
  toBranch?: string;
  commitMessage?: string;
} & JsonObject;


export const FieldsSchema: Schema = {
  type: 'object',
  properties: {
    toBranch: {
      title: 'New branch to commit and push',
      type: 'string',
    },
    commitMessage: {
      title: 'Commit message string.',
      type: 'string'
    },
    targetPath: {
      title: 'Relative path on workspace path where was stored repository contents, default is \'./\'.',
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

export function createGitCommitFromAzureAction(options: {
  config: Config;
}) {
  const { config } = options;
  const AZURE_DEVOPS_TOKEN = config.getConfigArray('integrations.azure')[0].getString('token');
  
  return createTemplateAction<InputType, OutputType>({
    id: GIT_COMMIT_AZURE,
    description: 'Commit and Push content from an Azure DevOps Git Repository',
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
        
        logger.info(`Commiting to '${repoUrl}'...`)

        const dir = await clone({
          input,
          logger,
          workspacePath: ctx.workspacePath,
          AZURE_DEVOPS_TOKEN,
          user: ctx.user
        });

        results.push(dir)
      }
      output('results', results);
    },
  });
}
async function clone({
  input: {
    toBranch,
    commitMessage = 'chore: backstage git:commit:azure',
    targetPath
  },
  logger,
  AZURE_DEVOPS_TOKEN,
  workspacePath,
  user,
}: {
  input: FieldsType, 
  logger: Logger, 
  AZURE_DEVOPS_TOKEN: string,
  workspacePath: string,
  user: any
}) {

  const dir = getRepoSourceDirectory(workspacePath, targetPath);
      
  const _git = Git.fromAuth({
    username: 'oauth2',
    password: AZURE_DEVOPS_TOKEN,
    logger: logger,
  });
  
  await _git.add({ dir, filepath: '.' });
  
  const authorInfo = {
    name: user?.entity?.spec.profile?.displayName ?? 'Backstage Guest',
    email: user?.entity?.spec.profile?.email ?? 'backstage.guest@anonymous.com',
  };
  
  if(!user?.entity?.spec.profile && user?.ref) {
    const { name: username } = parseEntityRef(user?.ref);
    authorInfo.name = username
    authorInfo.email = `${username}@mail.com`
  }
        
  if (toBranch) {
    await git.branch({ fs, dir, ref: toBranch, checkout: true });
  }

  const message = `${commitMessage}\n\nSigned-off-by: ${authorInfo.name} <${authorInfo.email}>\n\nSigned-off-by: Backstage <backstage@backstage.io>`
  
  await _git.commit({
    dir,
    message: message,
    author: authorInfo,
    committer: authorInfo,
  });
  try {
    await _git.push({ dir, remote: 'origin' });
  } catch (error) {
    logger.error(``)
    logger.error(`Possible problem causes:`)
    logger.error(`  * Check if this branch '${toBranch}' already exists.`)
    logger.error(`  * Check if backstage local token have access to create and push branches and commits.`)
  }
}

