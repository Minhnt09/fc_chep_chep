import { Injectable, signal } from '@angular/core';
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { InteractionsBackend, Visitor } from './interactions.types';

export function interactionError(error: unknown): Error {
  const value = error as { code?: string; message?: string; status?: number } | null;
  if (value?.code === 'PGRST202' || value?.code === '42P01') return Error('Chưa thiết lập dữ liệu tương tác. Cần chạy file SQL trong Supabase.');
  if (value?.code === 'anonymous_provider_disabled') return Error('Chưa bật Anonymous sign-ins trong Supabase.');
  if (value?.code === 'over_request_rate_limit' || value?.status === 429) return Error('Có quá nhiều yêu cầu. Hãy đợi một chút rồi thử lại.');
  if (value?.code === '23505') return Error('Tương tác này đã được ghi nhận. Hãy tải lại để xem trạng thái mới nhất.');
  if (value?.code === 'P0001') return Error(value.message || 'Chưa gửi được. Hãy thử lại.');
  if (value?.code === '23514' || value?.code === '22023') return Error('Thông tin chưa hợp lệ. Hãy kiểm tra tên, điểm và độ dài nội dung.');
  if (value?.status === 401 || value?.code === 'PGRST301' || value?.code === 'PGRST303') return Error('Phiên truy cập hoặc cấu hình Supabase chưa hợp lệ. Hãy tải lại trang.');
  return Error('Không kết nối được dịch vụ tương tác. Nội dung chưa được xác nhận gửi; hãy thử lại khi có mạng.');
}

@Injectable({ providedIn: 'root' })
export class SupabaseInteractionsAdapter implements InteractionsBackend {
  readonly sessionWarning = signal('');
  private readonly client: SupabaseClient;
  private signIn: Promise<Visitor> | null = null;
  constructor() {
    // Only the auth session is stored locally. Old local interactions are never read/imported.
    const memory = new Map<string, string>();
    const warning = () => this.sessionWarning.set('Trình duyệt không lưu được phiên. Tên và định danh có thể mất khi tải lại; bài đã gửi vẫn ở trên hệ thống.');
    this.client = createClient(environment.supabaseUrl, environment.supabasePublishableKey, {
      auth: {
        persistSession: true, autoRefreshToken: true, detectSessionInUrl: false,
        storageKey: 'fc-chep-chep:auth:gbjtvclrciqgiwvsutto',
        storage: {
          getItem: key => { try { return localStorage.getItem(key) ?? memory.get(key) ?? null; } catch { warning(); return memory.get(key) ?? null; } },
          setItem: (key, value) => { memory.set(key, value); try { localStorage.setItem(key, value); } catch { warning(); } },
          removeItem: key => { memory.delete(key); try { localStorage.removeItem(key); } catch { warning(); } },
        },
      },
      global: { fetch: async (input, init) => {
        // A stalled connection must not leave the modal permanently disabled.
        const controller = new AbortController();
        const abort = () => controller.abort();
        init?.signal?.addEventListener('abort', abort, { once: true });
        if (init?.signal?.aborted) controller.abort();
        const timer = setTimeout(abort, 15000);
        try { return await fetch(input, { ...init, signal: controller.signal }); }
        finally { clearTimeout(timer); init?.signal?.removeEventListener('abort', abort); }
      } },
    });
  }
  private visitor(session: Session | null): Visitor | null {
    const name = session?.user.user_metadata['display_name'];
    return session?.user.is_anonymous && typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 30
      ? { id: session.user.id, displayName: name.trim() } : null;
  }
  async restoreVisitor() {
    const { data, error } = await this.client.auth.getSession();
    if (error) throw interactionError(error);
    return this.visitor(data.session);
  }
  onVisitorChange(callback: (visitor: Visitor | null) => void) {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => callback(this.visitor(session)));
    return () => data.subscription.unsubscribe();
  }
  async saveVisitor(name: string): Promise<Visitor> {
    if (this.signIn) return this.signIn;
    this.signIn = this.saveName(name);
    try { return await this.signIn; } finally { this.signIn = null; }
  }
  private async saveName(name: string): Promise<Visitor> {
    const session = await this.client.auth.getSession();
    if (session.error) throw interactionError(session.error);
    if (!session.data.session) {
      const { data, error } = await this.client.auth.signInAnonymously({ options: { data: { display_name: name } } });
      if (error) throw interactionError(error);
      const visitor = this.visitor(data.session);
      if (!visitor) throw Error('Không tạo được phiên truy cập. Hãy thử lại.');
      return visitor;
    }
    if (!session.data.session.user.is_anonymous) throw Error('Phiên này không phải phiên khách. Hãy thử bằng cửa sổ riêng tư.');
    const { data, error } = await this.client.auth.updateUser({ data: { display_name: name } });
    if (error) throw interactionError(error);
    return { id: data.user.id, displayName: name };
  }
  async rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
    let result;
    try { result = await this.client.rpc(name, args); }
    catch (error) { throw interactionError(error); }
    if (result.error) throw interactionError(result.error);
    return result.data as T;
  }
}
