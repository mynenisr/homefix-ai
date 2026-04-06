import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function sendSMS(to: string, message: string): Promise<void> {
  if (!client || !fromNumber) {
    console.log(`[SMS Stub] To: ${to} | Message: ${message}`);
    return;
  }

  try {
    await client.messages.create({
      body: message,
      from: fromNumber,
      to,
    });
  } catch (error) {
    console.error('Twilio SMS error:', error);
    throw error;
  }
}

// ─── Notification Templates ─────────────────────────────

export const smsTemplates = {
  caseCreated: (caseId: string) =>
    `[HomeFixAI] Your maintenance request #${caseId.slice(0, 8)} has been received. We'll update you shortly.`,

  vendorAssigned: (vendorName: string, caseId: string) =>
    `[HomeFixAI] ${vendorName} has been assigned to your case #${caseId.slice(0, 8)}. They will contact you to schedule.`,

  vendorNotification: (address: string, category: string) =>
    `[HomeFixAI] New job assignment: ${category} issue at ${address}. Log in to view details and confirm.`,

  appointmentScheduled: (date: string, vendorName: string) =>
    `[HomeFixAI] Appointment confirmed with ${vendorName} on ${date}. We'll send a reminder before your visit.`,

  appointmentReminder: (date: string, vendorName: string) =>
    `[HomeFixAI] Reminder: ${vendorName} is scheduled to visit tomorrow at ${date}.`,

  caseCompleted: (caseId: string) =>
    `[HomeFixAI] Your case #${caseId.slice(0, 8)} has been marked complete. Please rate your experience!`,

  emergencyAlert: (description: string) =>
    `[HomeFixAI] EMERGENCY ALERT: ${description}. If you are in immediate danger, call 911.`,
};
