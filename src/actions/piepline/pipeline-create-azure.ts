import { Config } from '@backstage/config';

import { LoggerService } from '@backstage/backend-plugin-api';
import { ScmIntegrations } from '@backstage/integration';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { JsonObject } from '@backstage/types';
import { Schema } from 'jsonschema';
import {
  AzurePipelineService,
  AzureRepoService,
  PipelineCreatePayload,
  getDefaultPipelinePayload as _getDefaultPipelinePayload,
  azureAxiosInstance
} from '../../internals';
import { parseRepoUrl } from '../utils';
import { PIPELINE_CREATE_AZURE } from './ids';
import { examples } from './pipeline-create-azure.examples';

export type FieldsType = {
  pipelinePath?: string;
  yamlFilename?: string;
  pipelineName?: string;
  defaultBranch?: string;
  repoUrl: string;
} & JsonObject;


export const FieldsSchema: Schema = {
  type: 'object',
  properties: {
    pipelinePath: {
      type: 'string',
      title: 'pipelinePath',
      description: 'pipelinePath',
    },
    yamlFilename: {
      type: 'string',
      title: 'Pipeline yaml path',
      description: '(default: .azuredevops/azure-pipelines.yaml)Path to pipeline yaml file',
    },
    pipelineName: {
      type: 'string',
      title: 'pipelineName',
      description: 'Nome do pipeline',
    },
    defaultBranch: {
      type: 'string',
      title: 'Default branch ref',
      description: '(default: refs/heads/main) Nome do pipeline',
    },
    repoUrl: {
      title: 'RepoUrl',
      description: 'Repo Url to be parsed with parseRepoUrl',
      type: 'string',
    },
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

const _getDefaultEmpty = (_r: string) => Promise.resolve('');
const __getDefaultPipelinePayload = 
  (r: {id: string, name: string, project: {id: string}}) => Promise.resolve(_getDefaultPipelinePayload(r))

export function createPipelineCreateAzureAction(options: {
  config: Config;
  integrations: ScmIntegrations;
  logger: LoggerService;
  getDefaultOrganization?: (repoUrl: string)=>Promise<string>;
  getDefaultProject?: (repoUrl: string)=>Promise<string>;
  getDefaultPipelinePayload?: (repoInfo: {id: string, name: string, project: {id: string}}) => Promise<PipelineCreatePayload>
}) {
  const {
    config,
    integrations,
    logger: mainLogger,
    getDefaultOrganization,
    getDefaultProject,
    getDefaultPipelinePayload,
  } = options;
  const AZURE_DEVOPS_TOKEN = config.getConfigArray('integrations.azure')[0].getString('token');
  
  let axiosHandler = azureAxiosInstance(AZURE_DEVOPS_TOKEN);
  let repoService: AzureRepoService;
  let pipeService: AzurePipelineService;

  try {
    axiosHandler = azureAxiosInstance(AZURE_DEVOPS_TOKEN);
    repoService = new AzureRepoService(axiosHandler);
    pipeService = new AzurePipelineService(axiosHandler);
  } catch (error: any) {
    if(error?.message) mainLogger.error(error?.message);
  }

  return createTemplateAction<InputType, OutputType>({
    id: PIPELINE_CREATE_AZURE,
    description: 'Create Pipeline from an Azure DevOps Git Repository',
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
        const { 
          repoUrl,
          yamlFilename,
          defaultBranch,
          pipelinePath,
          pipelineName,
        }  = input;
        
        logger.info(`Creating pipeline to '${repoUrl}'...`)

        const {
          repo: repoName,
          organization,
          project
        } = {
          organization: await (getDefaultOrganization ?? _getDefaultEmpty)(repoUrl),
          project: await (getDefaultProject ?? _getDefaultEmpty)(repoUrl),
          ...parseRepoUrl(repoUrl, integrations)
        }

        const repositoryInfo = await repoService.info({
          repository: repoName,
          project,
          organization
        });
        
        logger.info(`repo: ${JSON.stringify(repositoryInfo.data)}`);
        const payload = await (getDefaultPipelinePayload ?? __getDefaultPipelinePayload)(repositoryInfo.data)
        
        if(yamlFilename) payload.process.yamlFilename = yamlFilename;
        if(defaultBranch) payload.repository.defaultBranch = defaultBranch;
        if(pipelinePath) payload.path = `\\${pipelinePath}`;
        if(pipelineName) payload.name = pipelineName;
        

        logger.info(`payload: ${JSON.stringify(payload)}`);
        const res = await pipeService.create({organization}, repositoryInfo.data, payload);

        results.push(res.data)
      }
      output('results', results);
    },
  });
}


