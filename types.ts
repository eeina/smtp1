import 'react';

export interface User {
  _id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  recovery_email?: string;
  signature?: string;
  token?: string;
  role: 'client' | 'mailbox';
  created_at?: string;
}

export interface Domain {
  _id: string;
  name: string;
  verification_token: string;
  is_verified: boolean;
  mx_status: string;
  dkim_public_key?: string;
}

export interface Mailbox {
  _id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  recovery_email?: string;
  signature?: string;
  domain_id: { _id: string; name: string } | string;
  last_admin_access?: string; // Date string
}

export interface AttachmentMeta {
  filename: string;
  contentType: string;
  size: number;
}

export interface EmailMessage {
  _id: string;
  from: string;
  to: string;
  subject: string;
  text_body: string;
  html_body: string;
  folder: 'inbox' | 'sent' | 'drafts';
  is_read: boolean;
  created_at: string;
  has_attachments: boolean;
  attachments?: AttachmentMeta[];
}

export interface DnsStatus {
  verification: boolean;
  a_record: boolean;
  mx: boolean;
  spf: boolean;
  dmarc: boolean;
  dkim: boolean;
  found_mx?: string[];
  found_a?: string[];
  found_txt?: string[];
  server_ip?: string;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}