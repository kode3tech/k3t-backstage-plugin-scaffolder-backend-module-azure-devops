
import { TemplateExample } from '@backstage/plugin-scaffolder-node';
import yaml from 'yaml';
import { InputType } from "./pipeline-create-azure";
import { PIPELINE_CREATE_AZURE } from './ids';

export const examples: TemplateExample[] = [
  {
    description: 'Create multiples pipelines from same repo',
    example: yaml.stringify({
      steps: [
        {
          action: PIPELINE_CREATE_AZURE,
          id: 'pipeline-create-azure',
          name: 'Create pipelines',
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
          } as InputType,
        },
      ],
    }),
  },
];
