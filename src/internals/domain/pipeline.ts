import { Axios, AxiosResponse } from 'axios';
import {
  AzurePipelineInfo,
  AzurePipelineKey,
  AzurePipelineDefinition,
  AzurePipelineRunResult,
  PipelineCreatePayload,
} from './pipeline.types';
import { AzureRepositoryInfo, AzureRepositoryKey } from './repository.types';
// import { AzureRepoService } from './repository';

export class AzurePipelineService {
  constructor(
    private axios: Axios,
    // private _repoService?: AzureRepoService,
  ) {}

  async list({
    organization,
    project,
  }: Pick<AzurePipelineKey, 'organization' | 'project'>) {
    return this.axios.get<any, AxiosResponse<Array<AzurePipelineInfo>>>(
      `https://dev.azure.com/${organization}/${project}/_apis/pipelines`,
    );
  }
  /**
   * @deprecated use `getByName`
   * @param param0 
   * @returns 
   */
  async getByRepoName({
    organization,
    project,
    repository,
  }: AzureRepositoryKey) {
    const { data } = await this.list({ organization, project });
    return data.find(pipe => pipe.name === repository);
  }

  async getByName({
      organization,
      project,
      nameOrId
    }: AzurePipelineKey
  ) {
    const { data } = await this.list({ organization, project });

    return data.find(pipe => pipe.id === nameOrId || pipe.name === nameOrId);

  }

  async create(
    { organization }: Pick<AzureRepositoryKey, 'organization'>,
    repoInfo: AzureRepositoryInfo,
    pipeInfo: PipelineCreatePayload
  ) {

    const payload: PipelineCreatePayload = pipeInfo ?? getDefaultPipelinePayload(repoInfo);

    return this.axios.post<any, AxiosResponse<AzurePipelineDefinition>>(
      `https://dev.azure.com/${organization}/${repoInfo.project.id}/_apis/build/definitions`,
      JSON.stringify(payload),
      {
        params: {
          'api-version': '5.0',
        },
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      },
    );
  }
  /**
   * @deprecated use `definitionByName`
   * @param param0 
   * @returns 
   */
  async definitionByRepository({ organization, project, repository }: AzureRepositoryKey) {
    const info = await this.getByRepoName({
      organization,
      project,
      repository,
    });
    if (!info) return undefined;

    const { id, revision } = info;

    return this.axios.get<any, AxiosResponse<AzurePipelineDefinition>>(
      `https://dev.azure.com/${organization}/${project}/_apis/build/definitions/${id}`,
      {
        params: {
          'api-version': '6.0-preview.7',
          revision,
        },
      },
    );
  }

  async definition({ organization, project, id, nameOrId }: AzurePipelineKey) {
    const info = await this.getByName({
      organization,
      project,
      id, 
      nameOrId
    });
    if (!info) return undefined;

    return this.axios.get<any, AxiosResponse<AzurePipelineDefinition>>(
      `https://dev.azure.com/${organization}/${project}/_apis/build/definitions/${info.id}`,
      {
        params: {
          'api-version': '6.0-preview.7',
          revision: info.revision,
        },
      },
    );
  }

  async rename(
    renameTo: string,
    { organization, project, repository }: AzureRepositoryKey,
  ) {
    const res = await this.definitionByRepository({ organization, project, repository });
    if (!res) return undefined;
    const { id: definitionId } = res.data;

    return this.axios.put<any, AxiosResponse<AzurePipelineDefinition>>(
      `https://dev.azure.com/${organization}/${project}/_apis/build/definitions/${definitionId}`,
      JSON.stringify({
        ...res.data,
        name: renameTo,
      }),
      {
        params: {
          'api-version': '6.0-preview.7',
        },
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      },
    );
  }

  async remove(
    { organization, project, repository }: AzureRepositoryKey,
    useDefaultThrow = true,
  ): Promise<AxiosResponse | undefined> {
    const res = await this.definitionByRepository({ organization, project, repository });
    if (!res) return undefined;

    const { id: definitionId } = res.data;

    return this.axios.delete<any, any>(
      `https://dev.azure.com/${organization}/${project}/_apis/build/definitions/${definitionId}`,
      {
        params: {
          'api-version': '6.0-preview.7',
        },
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        validateStatus: useDefaultThrow ? undefined : () => true,
      },
    );
  }

  async runByRepository(
    { organization, project, repository }: AzureRepositoryKey, 
    { 
      stagesToSkip,
      resources,
      templateParameters,
      variables
    }: {
      stagesToSkip?: [],
      resources?: {
        repositories: { self: { refName: string } }
      },
      templateParameters?: Record<string, string | number | boolean>,
      variables?: Record<string, string | number | boolean>
    }
  ) {
    const res = await this.definitionByRepository({ organization, project, repository });
    if (!res) return undefined;

    const { id: definitionId } = res.data;
    
    return this.axios.post<any, AxiosResponse<AzurePipelineRunResult>>(
      `https://dev.azure.com/${organization}/${project}/_apis/pipelines/${definitionId}/runs?api-version=7.0`,
      JSON.stringify({
        ...{ resources: { repositories: { self: { refName: 'refs/heads/master' } }} },
        stagesToSkip,
        resources,
        templateParameters,
        variables,
        previewRun: 'false'
      }),
      {
        params: {
          'api-version': '6.0-preview.7',
        },
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        }
      },
    );
  }

  async run(
    { organization, project, id, nameOrId }: AzurePipelineKey, 
    { 
      stagesToSkip,
      resources,
      templateParameters,
      variables
    }: {
      stagesToSkip?: [],
      resources?: {
        repositories: { self: { refName: string } }
      },
      templateParameters?: Record<string, string | number | boolean>,
      variables?: Record<string, string | number | boolean>
    }
  ) {
    const res = await this.definition({ organization, project, id, nameOrId });
    if (!res) return undefined;

    const { id: definitionId } = res.data;
    
    return this.axios.post<any, AxiosResponse<AzurePipelineRunResult>>(
      `https://dev.azure.com/${organization}/${project}/_apis/pipelines/${definitionId}/runs?api-version=7.0`,
      JSON.stringify({
        ...{ resources: { repositories: { self: { refName: 'refs/heads/master' } }} },
        stagesToSkip,
        resources,
        templateParameters,
        variables,
        previewRun: 'false'
      }),
      {
        params: {
          'api-version': '6.0-preview.7',
        },
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        }
      },
    );
  }
}

export function getDefaultPipelinePayload(
  repoInfo: {id: string, name: string, project: {id: string}}
): PipelineCreatePayload {
  return {
    variables: '',
    triggers: [{
      branchFilters: [],
      pathFilters: [],
      settingsSourceType: 2,
      batchChanges: true,
      maxConcurrentBuildsPerBranch: 1,
      triggerType: 'continuousIntegration',
    }],
    retentionRules: [{
      branches: ['+refs/heads/*', '+refs/tags/*'],
      daysToKeep: 10,
      minimumToKeep: 1,
      deleteBuildRecord: true,
      deleteTestResults: true,
    }],
    queue: {
      name: 'Default',
      pool: { name: 'Default' },
    },
    buildNumberFormat: '$(date:yyyyMMdd)$(rev:.r)',
    jobAuthorizationScope: 1,
    jobTimeoutInMinutes: 60,
    jobCancelTimeoutInMinutes: 5,
    process: {
      yamlFilename: 'azuredevops/azure-pipelines.yaml',
      type: 2,
    },
    repository: {
      properties: {
        safeRepository: repoInfo.id,
        reportBuildStatus: true,
        fetchDepth: 0,
        cleanOptions: 3,
        gitLfsSupport: false,
        skipSyncSource: false,
        checkoutNestedSubmodules: false,
      },
      id: repoInfo.id,
      type: 'TfsGit',
      name: repoInfo.id,
      defaultBranch: 'refs/heads/master',
      clean: true,
      checkoutSubmodules: false,
    },
    name: repoInfo.name,
    path: '\\',
    type: 2,
    project: {
      id: repoInfo.project.id,
    },
  };
}

