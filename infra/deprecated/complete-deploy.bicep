/*
  USAsset API - Complete E2E Deployment
  
  Description: Full end-to-end deployment with proper configuration
  Features:
    - Backend with all required environment variables
    - Frontend with dynamic API URL injection
    - CORS configuration
    - Health check probes
    - Scaling rules
    - Key Vault integration
    
  Prerequisites:
    - Infrastructure deployed via infrastructure.bicep
    - Container images built and pushed to ACR
    
  Deployment:
    az deployment group create \
      --resource-group useng-usasset-api-rg \
      --template-file infra/complete-deploy.bicep \
      --parameters @infra/parameters.json
      
  Author: Development Team
  Version: 2.0
  Last Updated: 2025-08-28
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

@description('Name of the Key Vault')
param keyVaultName string

@description('Database password for connection string')
@secure()
param dbPassword string

@description('JWT secret for authentication')
@secure()
param jwtSecret string = newGuid()

@description('API key for external services')
@secure()
param apiKey string = newGuid()

@description('Environment (development, staging, production)')
@allowed(['development', 'staging', 'production'])
param environment string = 'production'

@description('Backend image tag')
param backendImageTag string = 'latest'

@description('Frontend image tag')
param frontendImageTag string = 'latest'

@description('Minimum replicas for backend')
param backendMinReplicas int = 1

@description('Maximum replicas for backend')
param backendMaxReplicas int = 10

@description('Minimum replicas for frontend')
param frontendMinReplicas int = 1

@description('Maximum replicas for frontend')
param frontendMaxReplicas int = 5

// Existing resources
resource acr 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' existing = {
  name: acrName
}

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' existing = {
  name: dbServerName
}

resource containerAppEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' existing = {
  name: containerEnvName
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

// Store secrets in Key Vault
resource dbConnectionSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'database-connection-string'
  properties: {
    value: 'postgresql://dbadmin:${dbPassword}@${postgres.properties.fullyQualifiedDomainName}:5432/usasset?sslmode=require'
  }
}

resource jwtSecretSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'jwt-secret'
  properties: {
    value: jwtSecret
  }
}

resource apiKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'api-key'
  properties: {
    value: apiKey
  }
}

// Backend Container App with complete configuration
resource backendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${projectName}-backend-${environment}'
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      activeRevisionsMode: 'Multiple'
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
        corsPolicy: {
          allowedOrigins: [
            'http://localhost:5173'
            'http://localhost:3000'
            'https://${projectName}-frontend-${environment}.${containerAppEnvironment.properties.defaultDomain}'
          ]
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
          allowedHeaders: ['*']
          allowCredentials: true
          maxAge: 86400
        }
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
      }
      secrets: [
        {
          name: 'database-url'
          value: 'postgresql://dbadmin:${dbPassword}@${postgres.properties.fullyQualifiedDomainName}:5432/usasset?sslmode=require'
        }
        {
          name: 'jwt-secret'
          value: jwtSecret
        }
        {
          name: 'api-key'
          value: apiKey
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
          image: '${acr.properties.loginServer}/backend:${backendImageTag}'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'NODE_ENV'
              value: environment
            }
            {
              name: 'PORT'
              value: '3000'
            }
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
            {
              name: 'JWT_SECRET'
              secretRef: 'jwt-secret'
            }
            {
              name: 'API_KEY'
              secretRef: 'api-key'
            }
            {
              name: 'CORS_ORIGIN'
              value: 'https://${projectName}-frontend-${environment}.${containerAppEnvironment.properties.defaultDomain}'
            }
            {
              name: 'LOG_TO_FILE'
              value: 'true'
            }
            {
              name: 'LOG_LEVEL'
              value: environment == 'production' ? 'info' : 'debug'
            }
            {
              name: 'RUN_SEED'
              value: 'false'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health/live'
                port: 3000
              }
              initialDelaySeconds: 30
              periodSeconds: 30
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/health/ready'
                port: 3000
              }
              initialDelaySeconds: 10
              periodSeconds: 10
              failureThreshold: 3
            }
            {
              type: 'Startup'
              httpGet: {
                path: '/health'
                port: 3000
              }
              initialDelaySeconds: 5
              periodSeconds: 5
              failureThreshold: 30
            }
          ]
        }
      ]
      scale: {
        minReplicas: backendMinReplicas
        maxReplicas: backendMaxReplicas
        rules: [
          {
            name: 'http-scale'
            http: {
              metadata: {
                concurrentRequests: '100'
              }
            }
          }
          {
            name: 'cpu-scale'
            custom: {
              type: 'cpu'
              metadata: {
                type: 'Utilization'
                value: '70'
              }
            }
          }
        ]
      }
    }
  }
}

// Frontend Container App
resource frontendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${projectName}-frontend-${environment}'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      activeRevisionsMode: 'Multiple'
      ingress: {
        external: true
        targetPort: 80
        transport: 'http'
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
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
          image: '${acr.properties.loginServer}/frontend:${frontendImageTag}'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              name: 'VITE_API_URL'
              value: 'https://${backendApp.properties.configuration.ingress.fqdn}'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/'
                port: 80
              }
              initialDelaySeconds: 10
              periodSeconds: 30
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/'
                port: 80
              }
              initialDelaySeconds: 5
              periodSeconds: 10
            }
          ]
        }
      ]
      scale: {
        minReplicas: frontendMinReplicas
        maxReplicas: frontendMaxReplicas
        rules: [
          {
            name: 'http-scale'
            http: {
              metadata: {
                concurrentRequests: '200'
              }
            }
          }
        ]
      }
    }
  }
  dependsOn: [
    backendApp
  ]
}

// Grant Key Vault access to Backend managed identity
resource keyVaultAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2023-07-01' = {
  parent: keyVault
  name: 'add'
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: backendApp.identity.principalId
        permissions: {
          secrets: ['get', 'list']
        }
      }
    ]
  }
}

// Outputs
output backendUrl string = 'https://${backendApp.properties.configuration.ingress.fqdn}'
output frontendUrl string = 'https://${frontendApp.properties.configuration.ingress.fqdn}'
output backendIdentityId string = backendApp.identity.principalId
output deploymentStatus object = {
  backend: {
    url: 'https://${backendApp.properties.configuration.ingress.fqdn}'
    healthCheck: 'https://${backendApp.properties.configuration.ingress.fqdn}/health'
    replicas: '${backendMinReplicas}-${backendMaxReplicas}'
  }
  frontend: {
    url: 'https://${frontendApp.properties.configuration.ingress.fqdn}'
    replicas: '${frontendMinReplicas}-${frontendMaxReplicas}'
  }
  database: {
    server: postgres.properties.fullyQualifiedDomainName
    status: 'Connected via SSL'
  }
}