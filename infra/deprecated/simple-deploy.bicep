/*
  USAsset API - Container Apps Deployment
  
  Description: Deploys NestJS backend and React frontend to existing Azure infrastructure
  Applications Deployed:
    - Backend: NestJS API with PostgreSQL connection
    - Frontend: React + Vite SPA with backend API integration
  
  Prerequisites:
    - Infrastructure deployed via infrastructure.bicep
    - Container images built and pushed to ACR:
      - backend:latest
      - frontend:latest
    
  Required Parameters:
    - acrName: From infrastructure deployment output
    - dbServerName: From infrastructure deployment output  
    - containerEnvName: From infrastructure deployment output
    - dbPassword: Same password used for infrastructure deployment
    
  Deployment:
    # Get infrastructure outputs
    ACR_NAME=$(az deployment group show --resource-group useng-usasset-api-rg --name infrastructure --query properties.outputs.acrName.value -o tsv)
    DB_NAME=$(az deployment group show --resource-group useng-usasset-api-rg --name infrastructure --query properties.outputs.dbServerName.value -o tsv)
    ENV_NAME=$(az deployment group show --resource-group useng-usasset-api-rg --name infrastructure --query properties.outputs.containerEnvName.value -o tsv)
    
    # Deploy applications
    az deployment group create \
      --resource-group useng-usasset-api-rg \
      --template-file infra/simple-deploy.bicep \
      --parameters acrName=$ACR_NAME dbServerName=$DB_NAME containerEnvName=$ENV_NAME dbPassword='<SECURE_PASSWORD>'
      
  Author: Development Team
  Version: 1.0
  Last Updated: 2025-08-27
*/

@description('Location for all resources')
param location string = resourceGroup().location

@description('Project name used for resource naming')
@minLength(3)
@maxLength(10)
param projectName string = 'usasset'

@description('Name of the Azure Container Registry')
param acrName string

@description('Name of the PostgreSQL server')
param dbServerName string

@description('Name of the Container App Environment')
param containerEnvName string

@description('Database password for connection string')
@secure()
param dbPassword string

// Existing resources
resource acr 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' existing = {
  name: acrName
}

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' existing = {
  name: dbServerName  // Should be usasset-db-yf2eqktewmxp2-v2
}

resource containerAppEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' existing = {
  name: containerEnvName
}

// Backend Container App
resource backendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${projectName}-backend'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
      }
      secrets: [
        {
          name: 'database-url'
          value: 'postgresql://dbadmin:${dbPassword}@${postgres.properties.fullyQualifiedDomainName}:5432/usasset'
        }
        {
          name: 'registry-password'
          value: listCredentials(acr.id, '2023-01-01-preview').passwords[0].value
        }
      ]
      registries: [
        {
          server: acr.properties.loginServer
          username: listCredentials(acr.id, '2023-01-01-preview').username
          passwordSecretRef: 'registry-password'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'backend'
          image: '${acr.properties.loginServer}/backend:latest'
          env: [
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

// Frontend Container App
resource frontendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${projectName}-frontend'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 80
      }
      secrets: [
        {
          name: 'registry-password'
          value: listCredentials(acr.id, '2023-01-01-preview').passwords[0].value
        }
      ]
      registries: [
        {
          server: acr.properties.loginServer
          username: listCredentials(acr.id, '2023-01-01-preview').username
          passwordSecretRef: 'registry-password'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'frontend'
          image: '${acr.properties.loginServer}/frontend:latest'
          env: [
            {
              name: 'VITE_API_URL'
              value: 'https://${backendApp.properties.configuration.ingress.fqdn}'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 2
      }
    }
  }
}

output backendUrl string = 'https://${backendApp.properties.configuration.ingress.fqdn}'
output frontendUrl string = 'https://${frontendApp.properties.configuration.ingress.fqdn}'