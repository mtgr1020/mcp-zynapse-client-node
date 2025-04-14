export interface AppConfig {
  server: {
    port: number;
    env: string;
    basePath: string;
  };
  mcp: {
    apiUrl: string | undefined;
    apiKey: string | undefined;
    timeout: number;
  };
}
