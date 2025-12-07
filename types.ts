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
  created_at: string;
}

// Workaround for missing JSX.IntrinsicElements definitions in some environments
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
      div: any;
      span: any;
      p: any;
      a: any;
      h1: any;
      h2: any;
      h3: any;
      h4: any;
      h5: any;
      h6: any;
      img: any;
      ul: any;
      li: any;
      ol: any;
      button: any;
      input: any;
      textarea: any;
      select: any;
      option: any;
      form: any;
      label: any;
      nav: any;
      main: any;
      header: any;
      footer: any;
      section: any;
      article: any;
      aside: any;
      table: any;
      thead: any;
      tbody: any;
      tr: any;
      th: any;
      td: any;
      strong: any;
      b: any;
      i: any;
      small: any;
      svg: any;
      path: any;
      circle: any;
      iframe: any;
    }
  }
}
