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
    
    // Parse debug categories
    const debugCategoriesEnv = import.meta.env.VITE_DEBUG_CATEGORIES || ''
    const debugCategories = debugCategoriesEnv ? 
      debugCategoriesEnv.split(',').map((c: string) => c.trim()) : 
      ['component', 'hook', 'api', 'state', 'event', 'performance', 'navigation', 'render', 'lifecycle']
    
    const baseConfig: AppConfig = {
      api: {
        baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
        timeout: 30000
      },
      features: {
        auth: import.meta.env.VITE_ENABLE_AUTH === 'true',
        analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
      },
      debug: {
        enabled: import.meta.env.VITE_DEBUG === 'true' || 
                 import.meta.env.VITE_DEBUG_ENABLED === 'true' ||
                 env === 'development',
        categories: debugCategories,
        sendToBackend: import.meta.env.VITE_DEBUG_SEND_TO_BACKEND !== 'false',
        consoleEnabled: import.meta.env.VITE_DEBUG_CONSOLE_ENABLED !== 'false',
        performance: import.meta.env.VITE_DEBUG_PERFORMANCE === 'true'
      },
      environment: env as AppConfig['environment']
    }

    return this.mergeWithEnvironmentConfig(baseConfig, env)
  }

  private mergeWithEnvironmentConfig(base: AppConfig, env: string): AppConfig {
    const envConfigs: Record<string, Partial<AppConfig>> = {
      development: {
        api: {
          ...base.api,
          timeout: 60000
        },
        debug: {
          ...base.debug,
          enabled: true
        }
      },
      staging: {
        features: {
          ...base.features,
          analytics: true
        },
        debug: {
          ...base.debug,
          categories: ['api', 'event', 'performance']
        }
      },
      production: {
        features: {
          auth: true,
          analytics: true
        },
        debug: {
          ...base.debug,
          enabled: false,
          consoleEnabled: false,
          categories: ['api']
        }
      }
    }

    const envConfig = envConfigs[env] || {}
    
    return {
      ...base,
      ...envConfig,
      api: { ...base.api, ...envConfig.api },
      features: { ...base.features, ...envConfig.features },
      debug: { ...base.debug, ...envConfig.debug }
    }
  }

  get api() {
    return this.config.api
  }

  get features() {
    return this.config.features
  }

  get debug() {
    return this.config.debug
  }

  get environment() {
    return this.config.environment
  }

  get isDevelopment() {
    return this.config.environment === 'development'
  }

  get isProduction() {
    return this.config.environment === 'production'
  }
}

export const config = new ConfigService()
export default config