#!/bin/bash

# Check current Azure deployment status
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR=".logs"
LOG_FILE="$LOG_DIR/azure-status-$TIMESTAMP.log"

mkdir -p $LOG_DIR

# Function to output to both console and log file
output() {
    echo "$@" | tee -a "$LOG_FILE"
}

output "🔍 Checking Azure Deployment Status..."
output "=================================="
output "📝 Logging to: $LOG_FILE"
output ""

RESOURCE_GROUP="useng-usasset-api-rg"

# Check if resource group exists
output "📁 Resource Group: $RESOURCE_GROUP"
RG_EXISTS=$(az group exists --name $RESOURCE_GROUP)
if [ "$RG_EXISTS" = "true" ]; then
    output "   ✅ Resource group exists"
else
    output "   ❌ Resource group not found"
    exit 1
fi

output ""
output "📋 Checking Deployments..."
output "--------------------------"
# List all deployments
az deployment group list --resource-group $RESOURCE_GROUP --query "[].{Name:name, State:properties.provisioningState, Timestamp:properties.timestamp}" -o table | tee -a "$LOG_FILE"

output ""
output "🔧 Checking Resources..."
output "--------------------------"
# List all resources in the group
az resource list --resource-group $RESOURCE_GROUP --query "[].{Name:name, Type:type, Location:location}" -o table | tee -a "$LOG_FILE"

# Check for specific resources
output ""
output "📦 Container Registry:"
ACR=$(az acr list --resource-group $RESOURCE_GROUP --query "[0].{Name:name, LoginServer:loginServer, Status:provisioningState}" -o json)
if [ -n "$ACR" ] && [ "$ACR" != "[]" ]; then
    echo "$ACR" | jq '.' | tee -a "$LOG_FILE"
    ACR_NAME=$(echo "$ACR" | jq -r '.Name')
    
    # List images in ACR
    output "   📦 Images in registry:"
    az acr repository list --name $ACR_NAME -o table 2>/dev/null | tee -a "$LOG_FILE" || output "   No images or access denied"
else
    output "   ❌ No container registry found"
fi

output ""
output "🗄️ PostgreSQL Database:"
DB=$(az postgres flexible-server list --resource-group $RESOURCE_GROUP --query "[0].{Name:name, State:state, Version:version, FQDN:fullyQualifiedDomainName}" -o json)
if [ -n "$DB" ] && [ "$DB" != "[]" ]; then
    echo "$DB" | jq '.' | tee -a "$LOG_FILE"
else
    output "   ❌ No PostgreSQL server found"
fi

output ""
output "🔐 Key Vault:"
KV=$(az keyvault list --resource-group $RESOURCE_GROUP --query "[0].{Name:name, Location:location}" -o json)
if [ -n "$KV" ] && [ "$KV" != "[]" ]; then
    echo "$KV" | jq '.' | tee -a "$LOG_FILE"
    KV_NAME=$(echo "$KV" | jq -r '.Name')
    
    # List secrets (names only, not values)
    output "   🔑 Secrets in vault:"
    az keyvault secret list --vault-name $KV_NAME --query "[].{Name:name, Enabled:attributes.enabled}" -o table 2>/dev/null | tee -a "$LOG_FILE" || output "   No access to list secrets"
else
    output "   ❌ No Key Vault found"
fi

output ""
output "🌐 Container Apps Environment:"
ENV=$(az containerapp env list --resource-group $RESOURCE_GROUP --query "[0].{Name:name, Location:location, ProvisioningState:properties.provisioningState}" -o json)
if [ -n "$ENV" ] && [ "$ENV" != "[]" ]; then
    echo "$ENV" | jq '.' | tee -a "$LOG_FILE"
    ENV_NAME=$(echo "$ENV" | jq -r '.Name')
else
    output "   ❌ No Container Apps Environment found"
fi

output ""
output "🚀 Container Apps:"
APPS=$(az containerapp list --resource-group $RESOURCE_GROUP --query "[].{Name:name, FQDN:properties.configuration.ingress.fqdn, State:properties.provisioningState}" -o table)
if [ -n "$APPS" ] && [ "$APPS" != "Name	FQDN	State" ]; then
    echo "$APPS" | tee -a "$LOG_FILE"
    
    # Get detailed info for each app
    for APP_NAME in $(az containerapp list --resource-group $RESOURCE_GROUP --query "[].name" -o tsv); do
        output ""
        output "   📱 App: $APP_NAME"
        output "   Configuration:"
        az containerapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query "{Image:properties.template.containers[0].image, Port:properties.configuration.ingress.targetPort, Replicas:properties.template.scale, EnvVars:properties.template.containers[0].env[].name}" -o json | jq '.' | tee -a "$LOG_FILE"
    done
else
    output "   ❌ No Container Apps found"
fi

output ""
output "=================================="
output "📊 Summary:"
output "Use this information to understand what's deployed and what needs to be configured."
output ""
output "To get infrastructure outputs (if deployed):"
output "az deployment group show --resource-group $RESOURCE_GROUP --name infrastructure --query properties.outputs -o json"
output ""
output "✅ Full log saved to: $LOG_FILE"