import { supabase } from "../services/supabaseClient";

/**
 * auditLogger.ts — Service to record security and business events.
 * Writes to the 'audit_logs' table in Supabase.
 */

export type AuditAction = 
  | 'login_success' 
  | 'login_failed' 
  | 'logout'
  | 'record_created'
  | 'record_updated'
  | 'record_deleted'
  | 'unauthorized_access_attempt'
  | 'security_settings_changed';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditLogParams {
  action: AuditAction;
  company_id: string;
  resource?: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
  severity?: AuditSeverity;
}

/**
 * Logs an event to the audit_logs table.
 * Handled gracefully if it fails to ensure app continues working.
 */
export async function logAuditEvent({
  action,
  company_id,
  resource,
  resource_id,
  metadata = {},
  severity = 'info'
}: AuditLogParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Add client-side hints to metadata
    const auditMetadata = {
      ...metadata,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      url: window.location.href,
    };

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        company_id,
        user_id: user?.id,
        action,
        resource,
        resource_id,
        metadata: auditMetadata,
        severity
      });

    if (error) {
      console.error('Failed to log audit event:', error.message);
    }
  } catch (err) {
    console.error('Error in audit logger:', err);
  }
}

/**
 * Specialized logger for failed login attempts (tracking email for protection).
 */
export async function logFailedLogin(email: string, company_id?: string): Promise<void> {
  // If company_id is unknown (e.g. login screen before auth), we log without it
  // or use a placeholder if the schema requires it. In our schema it can be null if needed,
  // but better to try to link it if possible.
  
  await logAuditEvent({
    action: 'login_failed',
    company_id: company_id || '00000000-0000-0000-0000-000000000000', // System placeholder for pre-auth
    metadata: { email },
    severity: 'warning'
  });
}
