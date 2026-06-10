type RefreshTokenCallback = () => Promise<string | null>;

class TokenRefreshService {
  private refreshCallback: RefreshTokenCallback | null = null;

  registerRefreshCallback(callback: RefreshTokenCallback) {
    this.refreshCallback = callback;
  }

  async refreshToken(): Promise<string | null> {
    if (!this.refreshCallback) return null;
    return await this.refreshCallback();
  }

  clearCallback() {
    this.refreshCallback = null;
  }
}

export const tokenRefreshService = new TokenRefreshService();
