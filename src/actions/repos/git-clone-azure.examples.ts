
import { TemplateExample } from '@backstage/plugin-scaffolder-node';
import yaml from 'yaml';
import { InputType } from "./git-clone-azure";
import { GIT_CLONE_AZURE } from './ids';

export const examples: TemplateExample[] = [
  {
    description: 'Clone multiple repos form same Refs',
    example: yaml.stringify({
      steps: [
        {
          action: GIT_CLONE_AZURE,
          id: 'git-azure-clone',
          name: 'Clone from azure repo same ref',
          input: {
            commonParams: {
              fromRef: 'ref/heads/main',
            },
            params: [{
              repoUrl: 'dev.azure.com?owner=backstage-demo&organization=k3tech&repo=my-repo-1',
              targetPath: './repo-1'
            },
            {
              repoUrl: 'dev.azure.com?owner=backstage-demo&organization=k3tech&repo=my-repo-2',
              targetPath: './repo-2'
            }]
          } as InputType,
        },
      ],
    }),
  },
];
