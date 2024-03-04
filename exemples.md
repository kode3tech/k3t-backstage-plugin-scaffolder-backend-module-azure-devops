### Create multiples pipelines from same repo

```yaml
steps:
  - action: pipeline:create:azure
    id: pipeline-create-azure
    name: Create pipelines
    input:
      commonParams:
        defaultBranch: ref/heads/main
        pipelinePath: my-microsservices
        yamlFilename: .azure-pipeline.yaml
      params:
        - repoUrl: ./repo-1
          pipelineName: repo-1
        - repoUrl: ./repo-2
          pipelineName: repo-2

```

### Clone multiple repos form same Refs

```yaml
steps:
  - action: git:clone:azure
    id: git-azure-clone
    name: Clone from azure repo same ref
    input:
      commonParams:
        fromRef: ref/heads/main
      params:
        - repoUrl: dev.azure.com?owner=backstage-demo&organization=k3tech&repo=my-repo-1
          targetPath: ./repo-1
        - repoUrl: dev.azure.com?owner=backstage-demo&organization=k3tech&repo=my-repo-2
          targetPath: ./repo-2

```

### Commit to multiple repos form same Refs

```yaml
steps:
  - action: git:commit:azure
    id: git-azure-commit
    name: Commit to azure repo same ref
    input:
      commonParams:
        toBranch: ref/heads/main
        commitMessage: "chore: backstage git:commit:azure"
      params:
        - targetPath: ./repo-1
        - targetPath: ./repo-2

```
