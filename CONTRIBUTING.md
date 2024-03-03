
## Fast Development

```sh
git submodule add git@github.com:kode3tech/k3t-backstage-plugin-scaffolder-backend-module-azure-devops.git plugins/scaffolder-backend-module-azure-devops
```

## Publishing

```sh

yarn login

yarn release:full && yarn && tsc && yarn build &&  yarn pack && yarn publish --non-interactive

```

