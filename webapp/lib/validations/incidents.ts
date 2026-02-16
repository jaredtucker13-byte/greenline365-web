import { z } from 'zod';

// POST /api/incidents — Create new incident (The Stain)
export const CreateIncidentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500).optional(),
  description: z.string().min(1, 'Description is required'),
  customer_name: z.string().min(1, 'Customer name is required').max(255),
  customer_email: z.string().email('Valid email is required'),
  customer_phone: z.string().max(20).optional(),
  property_address: z.string().min(1, 'Property address is required').max(500),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
});

// PUT /api/incidents — Update incident
export const UpdateIncidentSchema = z.object({
  id: z.string().uuid('Valid incident ID is required'),
  title: z.string().min(1).max(500).optional(),
  description: z.string().min(1).optional(),
  customer_name: z.string().min(1).max(255).optional(),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().max(20).optional(),
  property_address: z.string().min(1).max(500).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['draft', 'documented', 'pending_signature', 'signed', 'refused', 'resolved']).optional(),
  report_sections: z.record(z.unknown()).optional(),
  ai_analysis: z.record(z.unknown()).optional(),
});

// POST /api/incidents/sign — Acknowledge or Refuse (The Shield)
export const SignIncidentSchema = z.object({
  token: z.string().min(1, 'Signature token is required'),
  action: z.enum(['acknowledge', 'refuse'], {
    message: 'Action must be "acknowledge" or "refuse"',
  }),
  signer_name: z.string().min(1, 'Signer name is required').max(255),
  refusal_reason: z.string().min(1, 'Refusal reason is required when refusing').optional(),
}).refine(
  (data) => data.action !== 'refuse' || !!data.refusal_reason,
  { message: 'Refusal reason is required when refusing to sign', path: ['refusal_reason'] }
);

// POST /api/incidents/send-for-signature — Send signature request email
export const SendForSignatureSchema = z.object({
  incident_id: z.string().uuid('Valid incident ID is required'),
});

export type CreateIncidentInput = z.infer<typeof CreateIncidentSchema>;
export type UpdateIncidentInput = z.infer<typeof UpdateIncidentSchema>;
export type SignIncidentInput = z.infer<typeof SignIncidentSchema>;
export type SendForSignatureInput = z.infer<typeof SendForSignatureSchema>;
