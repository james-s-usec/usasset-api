/*
  USAsset API - Infrastructure Deployment
  
  Description: Creates core Azure infrastructure for USAsset API application
  Resources Created:
    - Azure Container Registry (globally unique)
    - Azure Key Vault (for secrets management)
    - PostgreSQL Flexible Server (application database)
    - Container App Environment (for hosting applications)
  
  Prerequisites:
    - Resource Group: useng-usasset-api-rg
    - Azure CLI authenticated with sufficient permissions
    
  Naming Convention:
    - Project: usasset
    - Pattern: {project}-{type}-{uniqueString} or {project}{type}{uniqueString}
    - Unique Suffix: Generated from resourceGroup().id hash
    
  Deployment:
    az deployment group create \
      --resource-group useng-usasset-api-rg \
      --template-file infra/infrastructure.bicep \
      --parameters dbAdminPassword='<SECURE_PASSWORD>'
      
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

@description('Administrator password for PostgreSQL server')
@secure()
@minLength(8)
param dbAdminPassword string

// Generate unique suffix for resource naming
var uniqueSuffix = uniqueString(resourceGroup().id)

// Container Registry
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' = {
  name: '${projectName}acr${uniqueSuffix}'
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// Key Vault for secrets management
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: '${projectName}-kv-${uniqueSuffix}'
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    accessPolicies: []
  }
}

// PostgreSQL Flexible Server
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: '${projectName}-db-${uniqueSuffix}'
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: 'dbadmin'
    administratorLoginPassword: dbAdminPassword
    storage: {
      storageSizeGB: 32
    }
    version: '15'
  }
}

// Container App Environment
resource containerEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: '${projectName}-env-${uniqueSuffix}'
  location: location
  properties: {}
}

// Outputs for use in subsequent deployments
output acrName string = containerRegistry.name
output acrLoginServer string = containerRegistry.properties.loginServer
output keyVaultName string = keyVault.name
output dbServerName string = postgresServer.name
output dbServer string = postgresServer.properties.fullyQualifiedDomainName
output containerEnvName string = containerEnvironment.name
output containerEnvId string = containerEnvironment.id