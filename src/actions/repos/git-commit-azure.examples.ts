
import { TemplateExample } from '@backstage/plugin-scaffolder-node';
import yaml from 'yaml';
import { InputType } from "./git-commit-azure";
import { GIT_COMMIT_AZURE } from './ids';

export const examples: TemplateExample[] = [
  {
    description: 'Commit to multiple repos form same Refs',
    example: yaml.stringify({
      steps: [
        {
          action: GIT_COMMIT_AZURE,
          id: 'git-azure-commit',
          name: 'Commit to azure repo same ref',
          input: {
            commonParams: {
              toBranch: 'ref/heads/main',
              commitMessage: 'chore: backstage git:commit:azure',
            },
            params: [{
              targetPath: './repo-1'
            },
            {
              targetPath: './repo-2'
            }]
          } as InputType,
        },
      ],
    }),
  },
];
