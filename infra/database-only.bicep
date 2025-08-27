/*
  USAsset API - PostgreSQL Database Deployment Only
  
  Description: Deploys only the PostgreSQL Flexible Server to existing infrastructure
  Use Case: When other infrastructure exists but database deployment failed
  
  Prerequisites:
    - Resource Group: useng-usasset-api-rg
    - Azure CLI authenticated with sufficient permissions
    
  Deployment:
    az deployment group create \
      --resource-group useng-usasset-api-rg \
      --template-file infra/database-only.bicep \
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

// PostgreSQL Flexible Server
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: '${projectName}-db-${uniqueSuffix}-v2'
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
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
    network: {
      // publicNetworkAccess is read-only, removed
    }
  }
}

// Firewall rule to allow Azure services
resource postgresFirewallRule 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-03-01-preview' = {
  parent: postgresServer
  name: 'AllowAllAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Create the database
resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  parent: postgresServer
  name: 'usasset'
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// Outputs
output dbServerName string = postgresServer.name
output dbServer string = postgresServer.properties.fullyQualifiedDomainName
// Connection string removed - password should not be in outputs