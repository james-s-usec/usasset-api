interface AppConfig {
  api: {
    baseUrl: string
    timeout: number
  }
  features: {
    auth: boolean
    analytics: boolean
  }
  debug: {
    enabled: boolean
    categories: string[]
    sendToBackend: boolean
    consoleEnabled: boolean
    performance: boolean
  }
  environment: 'development' | 'staging' | 'production'
}

class ConfigService {
  private config: AppConfig

  constructor() {
    this.config = this.loadConfig()
  }

  private loadConfig(): AppConfig {
    const env = import.meta.env.VITE_ENV || 'development'
    const debugCategories = this.parseDebugCategories()
    const baseConfig = this.createBaseConfig(env, debugCategories)
    return this.mergeWithEnvironmentConfig(baseConfig, env)
  }

  private parseDebugCategories(): string[] {
    const envCategories = import.meta.env.VITE_DEBUG_CATEGORIES || ''
    if (!envCategories) {
      return this.getDefaultCategories()
    }
    return envCategories.split(',').map((c: string) => c.trim())
  }

  private getDefaultCategories(): string[] {
    return ['component', 'hook', 'api', 'state', 'event', 
            'performance', 'navigation', 'render', 'lifecycle']
  }

  private createBaseConfig(env: string, categories: string[]): AppConfig {
    return {
      api: this.getApiConfig(),
      features: this.getFeaturesConfig(),
      debug: this.getDebugConfig(env, categories),
      environment: env as AppConfig['environment']
    }
  }

  private getApiConfig(): AppConfig['api'] {
    return {
      baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      timeout: 30000
    }
  }

  private getFeaturesConfig(): AppConfig['features'] {
    return {
      auth: import.meta.env.VITE_ENABLE_AUTH === 'true',
      analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
    }
  }

  private getDebugConfig(env: string, categories: string[]): AppConfig['debug'] {
    return {
      enabled: this.isDebugEnabled(env),
      categories,
      sendToBackend: import.meta.env.VITE_DEBUG_SEND_TO_BACKEND !== 'false',
      consoleEnabled: import.meta.env.VITE_DEBUG_CONSOLE_ENABLED !== 'false',
      performance: import.meta.env.VITE_DEBUG_PERFORMANCE === 'true'
    }
  }

  private isDebugEnabled(env: string): boolean {
    return import.meta.env.VITE_DEBUG === 'true' || 
           import.meta.env.VITE_DEBUG_ENABLED === 'true' ||
           env === 'development'
  }

  private mergeWithEnvironmentConfig(base: AppConfig, env: string): AppConfig {
    const envConfig = this.getEnvironmentOverrides(base, env)
    return this.mergeConfigs(base, envConfig)
  }

  private getEnvironmentOverrides(base: AppConfig, env: string): Partial<AppConfig> {
    const overrides = {
      development: this.getDevelopmentOverrides(base),
      staging: this.getStagingOverrides(base),
      production: this.getProductionOverrides(base)
    }
    return overrides[env] || {}
  }

  private getDevelopmentOverrides(base: AppConfig): Partial<AppConfig> {
    return {
      api: { ...base.api, timeout: 60000 },
      debug: { ...base.debug, enabled: true }
    }
  }

  private getStagingOverrides(base: AppConfig): Partial<AppConfig> {
    return {
      features: { ...base.features, analytics: true },
      debug: { ...base.debug, categories: ['api', 'event', 'performance'] }
    }
  }

  private getProductionOverrides(base: AppConfig): Partial<AppConfig> {
    return {
      features: { auth: true, analytics: true },
      debug: {
        ...base.debug,
        enabled: false,
        consoleEnabled: false,
        categories: ['api']
      }
    }
  }

  private mergeConfigs(base: AppConfig, override: Partial<AppConfig>): AppConfig {
    return {
      ...base,
      ...override,
      api: { ...base.api, ...override.api },
      features: { ...base.features, ...override.features },
      debug: { ...base.debug, ...override.debug }
    }
  }

  get api(): AppConfig['api'] {
    return this.config.api
  }

  get features(): AppConfig['features'] {
    return this.config.features
  }

  get debug(): AppConfig['debug'] {
    return this.config.debug
  }

  get environment(): AppConfig['environment'] {
    return this.config.environment
  }

  get isDevelopment(): boolean {
    return this.config.environment === 'development'
  }

  get isProduction(): boolean {
    return this.config.environment === 'production'
  }
}

export const config = new ConfigService()
export default config