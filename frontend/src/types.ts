export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface EmailRow {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt?: string | null;
  status: "SCHEDULED" | "PROCESSING" | "SENT" | "FAILED";
  errorMessage?: string | null;
  previewUrl?: string | null;
}

export interface SlackStatus {
  connected: boolean;
  teamName?: string | null;
  channelId?: string | null;
}
