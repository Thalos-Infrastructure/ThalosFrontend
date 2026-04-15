import { createServiceClient } from '@/lib/supabase/service';
import { sendEmail, generateEmailContent, EmailEventType, AgreementEmailData } from './resend';

interface NotificationRecipient {
  wallet_address: string;
  email?: string;
  name?: string;
}

interface Agreement {
  id: string;
  title: string;
  amount?: number;
  currency?: string;
  milestones?: Array<{ description: string; amount?: number }>;
}

/**
 * Get user email from wallet address
 * Checks both profiles and auth_users tables
 */
async function getEmailByWallet(walletAddress: string): Promise<{ email: string | null; name: string | null }> {
  const supabase = createServiceClient();
  
  // First check profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, display_name')
    .eq('wallet_address', walletAddress)
    .single();
  
  if (profile?.email) {
    return { email: profile.email, name: profile.display_name };
  }
  
  // Then check auth_users
  const { data: authUser } = await supabase
    .from('auth_users')
    .select('email, name')
    .eq('wallet_public_key', walletAddress)
    .single();
  
  if (authUser?.email) {
    return { email: authUser.email, name: authUser.name };
  }
  
  // Check linked_wallets
  const { data: linkedWallet } = await supabase
    .from('linked_wallets')
    .select('user_id, auth_users(email, name)')
    .eq('wallet_address', walletAddress)
    .single();
  
  if (linkedWallet?.auth_users) {
    const user = linkedWallet.auth_users as { email: string; name: string };
    return { email: user.email, name: user.name };
  }
  
  return { email: null, name: null };
}

/**
 * Send notification for an agreement event
 */
export async function sendAgreementNotification(
  eventType: EmailEventType,
  agreement: Agreement,
  recipients: NotificationRecipient[],
  additionalData?: Partial<AgreementEmailData>
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = { sent: 0, failed: 0, errors: [] as string[] };
  
  for (const recipient of recipients) {
    // Get email if not provided
    let email = recipient.email;
    let name = recipient.name;
    
    if (!email) {
      const userData = await getEmailByWallet(recipient.wallet_address);
      email = userData.email || undefined;
      name = name || userData.name || undefined;
    }
    
    if (!email) {
      console.log(`[Notification] No email found for wallet ${recipient.wallet_address}`);
      continue;
    }
    
    const emailData: AgreementEmailData = {
      recipientName: name || 'Usuario',
      agreementTitle: agreement.title,
      agreementId: agreement.id,
      amount: agreement.amount?.toString(),
      currency: agreement.currency || 'USDC',
      ...additionalData,
    };
    
    const { subject, html } = generateEmailContent(eventType, emailData);
    
    const result = await sendEmail({ to: email, subject, html });
    
    if (result.success) {
      results.sent++;
      
      // Log to database
      await logNotification({
        agreementId: agreement.id,
        eventType,
        recipientEmail: email,
        recipientWallet: recipient.wallet_address,
        status: 'sent',
      });
    } else {
      results.failed++;
      results.errors.push(`${email}: ${result.error}`);
      
      await logNotification({
        agreementId: agreement.id,
        eventType,
        recipientEmail: email,
        recipientWallet: recipient.wallet_address,
        status: 'failed',
        errorMessage: result.error,
      });
    }
  }
  
  return results;
}

/**
 * Log notification to database for tracking
 */
async function logNotification(data: {
  agreementId: string;
  eventType: EmailEventType;
  recipientEmail: string;
  recipientWallet: string;
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
}) {
  try {
    const supabase = createServiceClient();
    await supabase.from('notification_logs').insert({
      agreement_id: data.agreementId,
      event_type: data.eventType,
      recipient_email: data.recipientEmail,
      recipient_wallet: data.recipientWallet,
      channel: 'email',
      status: data.status,
      error_message: data.errorMessage,
    });
  } catch (err) {
    console.error('[Notification] Failed to log notification:', err);
  }
}

// Convenience functions for specific events

export async function notifyAgreementCreated(
  agreement: Agreement,
  receiverWallet: string,
  senderName?: string
) {
  return sendAgreementNotification(
    'agreement_created',
    agreement,
    [{ wallet_address: receiverWallet }],
    { senderName }
  );
}

export async function notifyAgreementFunded(
  agreement: Agreement,
  sellerWallet: string,
  firstMilestone?: { description: string; amount?: number }
) {
  return sendAgreementNotification(
    'agreement_funded',
    agreement,
    [{ wallet_address: sellerWallet }],
    {
      milestoneDescription: firstMilestone?.description,
      amount: firstMilestone?.amount?.toString(),
    }
  );
}

export async function notifyEvidenceSubmitted(
  agreement: Agreement,
  buyerWallet: string,
  milestoneNumber: number,
  sellerName?: string
) {
  return sendAgreementNotification(
    'evidence_submitted',
    agreement,
    [{ wallet_address: buyerWallet }],
    { milestoneNumber, senderName: sellerName }
  );
}

export async function notifyMilestoneApproved(
  agreement: Agreement,
  sellerWallet: string,
  milestoneNumber: number,
  amount?: string
) {
  return sendAgreementNotification(
    'milestone_approved',
    agreement,
    [{ wallet_address: sellerWallet }],
    { milestoneNumber, amount }
  );
}

export async function notifyDisputeOpened(
  agreement: Agreement,
  participants: string[], // wallet addresses
  milestoneNumber: number,
  disputeReason?: string,
  amount?: string
) {
  return sendAgreementNotification(
    'dispute_opened',
    agreement,
    participants.map(wallet => ({ wallet_address: wallet })),
    { milestoneNumber, disputeReason, amount }
  );
}

export async function notifyDisputeResolved(
  agreement: Agreement,
  participants: string[],
  resolution: string,
  resolutionDetails?: string
) {
  return sendAgreementNotification(
    'dispute_resolved',
    agreement,
    participants.map(wallet => ({ wallet_address: wallet })),
    { resolution, resolutionDetails }
  );
}

export async function notifyAgreementCompleted(
  agreement: Agreement,
  participants: string[]
) {
  return sendAgreementNotification(
    'agreement_completed',
    agreement,
    participants.map(wallet => ({ wallet_address: wallet }))
  );
}
