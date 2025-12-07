import 'react';

export interface User {
  email: string;
  company_name?: string;
  token?: string;
  role: 'client' | 'mailbox';
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
  domain_id: { _id: string; name: string } | string;
}

export interface EmailMessage {
  _id: string;
  from: string;
  to: string;
  subject: string;
  text_body: string;
  html_body: string;
  folder: 'inbox' | 'sent';
  is_read: boolean;
  created_at: string;
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
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}