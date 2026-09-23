import * as os from "os";
import * as crypto from "crypto";

export interface GouAuthConfig {
  appId: string;
  baseUrl?: string; // Default: process.env.NEXT_PUBLIC_APP_URL ou https://gouauth.squareweb.app
  timeoutMs?: number;
}

export interface LicenseAuthResponse {
  authorized: boolean;
  license: string;
  status: string;
  expiresAt: string | null;
  timeRemainingSeconds: number | null;
  plan: {
    name: string;
    level: number;
    permissions: string[];
  } | null;
  device: {
    fingerprint: string;
    currentCount: number;
    limit: number;
  };
}

export interface UserAuthResponse {
  authorized: boolean;
  user: {
    username: string;
    expiresAt: string | null;
    timeRemainingSeconds: number | null;
    plan: {
      name: string;
      level: number;
      permissions: string[];
    } | null;
  };
  session_token: string;
}

export interface AppVersionResponse {
  latest_version: string;
  download_url?: string;
  update_available: boolean;
  update_required: boolean;
  changelog?: string;
  checksum?: string;
}

export class GouAuth {
  private appId: string;
  private baseUrl: string;
  private timeoutMs: number;

  constructor(config: GouAuthConfig) {
    if (!config.appId) throw new Error("GouAuth: appId é obrigatório.");
    this.appId = config.appId;
    this.baseUrl = (config.baseUrl || "http://localhost:3000").replace(/\/+$/, "");
    this.timeoutMs = config.timeoutMs || 10000;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "GouAuth-SDK/1.0",
          ...options.headers,
        },
      });

      const body = await res.json();
      if (!body.success) {
        throw new Error(body.error?.message || `Erro ${res.status}: Requisição falhou`);
      }
      return body.data as T;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Helper multiplataforma para obter identificador único (HWID) em ambiente Node.js
   */
  public static getDeviceFingerprint(): string {
    const raw = `${os.hostname()}:${os.platform()}:${os.arch()}:${os.cpus()[0]?.model || ""}:${os.totalmem()}`;
    return crypto.createHash("sha256").update(raw).digest("hex");
  }

  /**
   * Autenticação direta por chave de licença
   */
  public async loginWithLicense(params: {
    license: string;
    hwid?: string;
  }): Promise<LicenseAuthResponse> {
    const hwid = params.hwid || GouAuth.getDeviceFingerprint();
    return await this.request<LicenseAuthResponse>("/auth/license", {
      method: "POST",
      body: JSON.stringify({
        app_id: this.appId,
        license: params.license,
        hwid,
      }),
    });
  }

  /**
   * Autenticação por nome de usuário e senha
   */
  public async loginUser(params: {
    username: string;
    password: string;
    hwid?: string;
  }): Promise<UserAuthResponse> {
    const hwid = params.hwid || GouAuth.getDeviceFingerprint();
    return await this.request<UserAuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        app_id: this.appId,
        username: params.username,
        password: params.password,
        hwid,
      }),
    });
  }

  /**
   * Registro de nova conta de usuário vinculada a uma licença
   */
  public async registerUser(params: {
    username: string;
    password: string;
    license: string;
    email?: string;
    hwid?: string;
  }): Promise<{ message: string; username: string; expiresAt: string | null }> {
    const hwid = params.hwid || GouAuth.getDeviceFingerprint();
    return await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        app_id: this.appId,
        username: params.username,
        password: params.password,
        license: params.license,
        email: params.email,
        hwid,
      }),
    });
  }

  /**
   * Consulta status da aplicação (verificação de manutenção)
   */
  public async checkStatus(): Promise<{ status: string; maintenanceMessage: string | null; currentVersion: string }> {
    return await this.request(`/app/status?app_id=${encodeURIComponent(this.appId)}`);
  }

  /**
   * Consulta versões e atualizações da aplicação
   */
  public async checkVersion(currentVersion?: string): Promise<AppVersionResponse> {
    const query = new URLSearchParams({ app_id: this.appId });
    if (currentVersion) query.set("current_version", currentVersion);
    return await this.request<AppVersionResponse>(`/app/version?${query.toString()}`);
  }

  /**
   * Consulta variáveis remotas autorizadas
   */
  public async getVariables(key?: string): Promise<Record<string, unknown>> {
    const query = new URLSearchParams({ app_id: this.appId });
    if (key) query.set("key", key);
    const res = await this.request<{ variables: Record<string, unknown> }>(`/app/variables?${query.toString()}`);
    return res.variables;
  }
}
