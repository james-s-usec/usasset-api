interface AppConfig {
  api: {
    baseUrl: string
    timeout: number
  }
  features: {
    auth: boolean
    analytics: boolean
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
    
    const baseConfig: AppConfig = {
      api: {
        baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
        timeout: 30000
      },
      features: {
        auth: import.meta.env.VITE_ENABLE_AUTH === 'true',
        analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
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
        }
      },
      staging: {
        features: {
          ...base.features,
          analytics: true
        }
      },
      production: {
        features: {
          auth: true,
          analytics: true
        }
      }
    }

    const envConfig = envConfigs[env] || {}
    
    return {
      ...base,
      ...envConfig,
      api: { ...base.api, ...envConfig.api },
      features: { ...base.features, ...envConfig.features }
    }
  }

  get api() {
    return this.config.api
  }

  get features() {
    return this.config.features
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