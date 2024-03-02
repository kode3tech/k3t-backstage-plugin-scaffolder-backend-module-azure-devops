import { getRootLogger, loadBackendConfig } from '@backstage/backend-common';
import { Axios } from 'axios';
import { BackstageConfigIntegrations } from '../../backstage-config';
import { azureAxiosInstance } from './axios';
import { AzurePipelineService } from './pipeline';

jest.setTimeout(600000);

describe('Azure DevOps Pipeline Services', () => {
  let axiosHandler: Axios;
  let service: AzurePipelineService;
  let integrationsConfig: BackstageConfigIntegrations;

  beforeAll(async () => {
    const logger = getRootLogger();
    const config = await loadBackendConfig({
      logger,
      argv: process.argv,
    });
    integrationsConfig =
      config?.get<BackstageConfigIntegrations>('integrations') || {};
    const azurePAT =
      integrationsConfig?.azure?.find(() => true)?.token ||
      process.env.AZURE_DEVOPS_TOKEN ||
      '';

    try {
      axiosHandler = azureAxiosInstance(azurePAT);
      service = new AzurePipelineService(axiosHandler);
    } catch (error) {
      logger.error(error);
    }
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });
  test('Service instance check', async () => {
    expect(service).toBeDefined();
  });

});
