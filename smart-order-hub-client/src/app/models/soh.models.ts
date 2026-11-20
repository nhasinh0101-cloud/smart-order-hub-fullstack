export type UserRoleCode = 'ADMIN' | 'CS' | 'B2B_CUSTOMER' | 'SALES_SUPERVISOR';

export interface UserSession {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  role_code: UserRoleCode;
  role_name: string;
  company_name: string;
  customer_id?: string | null;
  partner_type: string;
  sap_customer_id?: string | null;
  status: string;
  can_submit_po: boolean;
}

export interface PurchaseOrder {
  po_id: string;
  hub_order_id: string;
  customer_id: string;
  customer_name?: string;
  sap_customer_id?: string;
  customer_po_number: string;
  intake_channel: string;
  current_version: string;
  current_status_code: string;
  status_name?: string;
  sap_sales_order_id?: string | null;
  total_amount: number;
  received_at: string;
  updated_at: string;
}

export interface ExceptionCase {
  exception_id: string;
  po_id: string;
  hub_order_id?: string;
  error_code: string;
  category?: string;
  severity: string;
  version_no?: string;
  assigned_department?: string;
  status: string;
  description: string;
  detected_at: string;
  stage?: string;
  stage_label?: string;
  action_required?: string;
  is_blocking?: boolean;
  po_version?: string | null;
  integration_transaction_id?: string | null;
  customer_update?: string;
}

export interface SapTransaction {
  transaction_id: string;
  po_id: string;
  hub_order_id?: string;
  customer_name?: string;
  po_version?: string;
  sent_at: string;
  transaction_status: string;
  sap_business_result: string;
  sap_sales_order_id?: string | null;
}
