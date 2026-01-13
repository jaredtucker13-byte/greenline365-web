import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register fonts (using system fonts for now)
// Font.register({ family: 'Inter', src: '/fonts/Inter-Regular.ttf' });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#00C853',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 8,
    color: '#666666',
    lineHeight: 1.4,
  },
  reportMeta: {
    textAlign: 'right',
    alignItems: 'flex-end',
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  reportId: {
    fontSize: 9,
    color: '#444444',
    marginBottom: 2,
  },
  // Section styles
  section: {
    marginBottom: 15,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a2e',
    backgroundColor: '#f0f0f0',
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00C853',
  },
  sectionContent: {
    paddingHorizontal: 5,
  },
  // Field styles
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  fieldLabel: {
    width: 130,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#444444',
  },
  fieldValue: {
    flex: 1,
    fontSize: 9,
    color: '#1a1a2e',
  },
  // Party box
  partyBox: {
    backgroundColor: '#fafafa',
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  partyTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  // Summary box
  summaryBox: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#333333',
  },
  // Evidence/Media
  evidenceItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  evidenceImage: {
    width: 80,
    height: 60,
    marginRight: 10,
    objectFit: 'cover',
  },
  evidenceDetails: {
    flex: 1,
  },
  evidenceCaption: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  evidenceMeta: {
    fontSize: 8,
    color: '#666',
  },
  // Timeline
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  timelineTime: {
    width: 100,
    fontSize: 8,
    color: '#666',
    fontFamily: 'Courier',
  },
  timelineEvent: {
    flex: 1,
    fontSize: 9,
  },
  timelineSource: {
    fontSize: 8,
    color: '#888',
    fontStyle: 'italic',
  },
  // Findings
  findingItem: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#fafafa',
    borderLeftWidth: 3,
  },
  findingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  findingTitle: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  findingSeverity: {
    fontSize: 8,
    padding: '2 6',
    borderRadius: 3,
    color: '#fff',
  },
  severityLow: { backgroundColor: '#4caf50' },
  severityMedium: { backgroundColor: '#ff9800' },
  severityHigh: { backgroundColor: '#f44336' },
  severityCritical: { backgroundColor: '#9c27b0' },
  findingDescription: {
    fontSize: 9,
    marginBottom: 4,
    lineHeight: 1.4,
  },
  findingAction: {
    fontSize: 8,
    color: '#00C853',
    fontStyle: 'italic',
  },
  // Liability section
  liabilityBox: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffc107',
    padding: 12,
    marginBottom: 10,
  },
  liabilityTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#856404',
  },
  liabilityText: {
    fontSize: 8,
    lineHeight: 1.5,
    color: '#333',
  },
  // Signature section
  signatureSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  signatureBox: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  signatureBlock: {
    flex: 1,
    marginRight: 20,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 4,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    height: 30,
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  signatureDate: {
    fontSize: 8,
    color: '#666',
  },
  signatureVerification: {
    fontSize: 7,
    color: '#888',
    marginTop: 2,
  },
  // Digital signature (e-sign)
  digitalSignature: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#4caf50',
    padding: 10,
    marginBottom: 10,
  },
  digitalSignatureTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  digitalSignatureDetails: {
    fontSize: 8,
    color: '#333',
  },
  // Refusal section
  refusalBox: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#f44336',
    padding: 10,
    marginBottom: 10,
  },
  refusalTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 4,
  },
  refusalText: {
    fontSize: 8,
    color: '#333',
  },
  // Audit metadata
  auditSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  auditTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  auditItem: {
    fontSize: 7,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'Courier',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: '#888',
    textAlign: 'center',
    lineHeight: 1.4,
  },
  pageNumber: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  // Cover page
  coverPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 10,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  coverMeta: {
    fontSize: 11,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  coverDate: {
    fontSize: 12,
    color: '#00C853',
    fontWeight: 'bold',
    marginTop: 20,
  },
  // Table styles
  table: {
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    padding: 6,
    fontSize: 8,
  },
  tableCellSmall: {
    width: 80,
    padding: 6,
    fontSize: 8,
  },
});

interface IncidentReportProps {
  incident: any;
  images: any[];
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
  };
  signatureEvents?: any[];
}

const getSeverityStyle = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case 'low': return styles.severityLow;
    case 'medium': return styles.severityMedium;
    case 'high': return styles.severityHigh;
    case 'critical': return styles.severityCritical;
    default: return styles.severityMedium;
  }
};

const formatDate = (date: string | Date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatShortDate = (date: string | Date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const IncidentReportPDF: React.FC<IncidentReportProps> = ({
  incident,
  images,
  company,
  signatureEvents = [],
}) => {
  const reportSections = incident.report_sections || {};
  const aiAnalysis = incident.ai_analysis || {};
  
  // Build timeline from events
  const timeline = reportSections.timeline || [];
  
  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <Text style={styles.coverTitle}>{company.name}</Text>
          <Text style={styles.coverSubtitle}>Incident Report & Liability Acknowledgment</Text>
          
          <View style={{ marginVertical: 30 }}>
            <Text style={styles.coverMeta}>Report ID: {incident.id?.substring(0, 8).toUpperCase()}</Text>
            <Text style={styles.coverMeta}>Property: {incident.property_address || 'N/A'}</Text>
            <Text style={styles.coverMeta}>Client: {incident.customer_name || 'N/A'}</Text>
          </View>
          
          <Text style={styles.coverDate}>
            Generated: {formatDate(new Date())}
          </Text>
          
          <View style={{ marginTop: 60 }}>
            <Text style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>
              CONFIDENTIAL DOCUMENT
            </Text>
            <Text style={{ fontSize: 8, color: '#888', textAlign: 'center', marginTop: 4 }}>
              This document contains proprietary information and should be handled accordingly.
            </Text>
          </View>
        </View>
      </Page>

      {/* Main Report */}
      <Page size="A4" style={styles.page}>
        {/* 1. Document Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text style={styles.companyDetails}>{company.address}</Text>
            <Text style={styles.companyDetails}>{company.phone} | {company.email}</Text>
            {company.website && <Text style={styles.companyDetails}>{company.website}</Text>}
          </View>
          <View style={styles.reportMeta}>
            <Text style={styles.reportTitle}>INCIDENT REPORT</Text>
            <Text style={styles.reportId}>Report ID: {incident.id?.substring(0, 8).toUpperCase()}</Text>
            <Text style={styles.reportId}>Created: {formatShortDate(incident.created_at)}</Text>
            <Text style={styles.reportId}>Version: 1.0</Text>
          </View>
        </View>

        {/* 2. Parties */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>1. PARTIES INVOLVED</Text>
          <View style={styles.sectionContent}>
            <View style={styles.partyBox}>
              <Text style={styles.partyTitle}>Reporting Company / Contractor</Text>
              <Text style={styles.fieldValue}>{company.name}</Text>
              <Text style={styles.fieldValue}>{company.address}</Text>
              <Text style={styles.fieldValue}>{company.phone} | {company.email}</Text>
            </View>
            <View style={styles.partyBox}>
              <Text style={styles.partyTitle}>Client / Site Owner</Text>
              <Text style={styles.fieldValue}>Name: {incident.customer_name || 'N/A'}</Text>
              <Text style={styles.fieldValue}>Email: {incident.customer_email || 'N/A'}</Text>
              <Text style={styles.fieldValue}>Phone: {incident.customer_phone || 'N/A'}</Text>
              <Text style={styles.fieldValue}>Property: {incident.property_address || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* 3. Incident Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>2. INCIDENT SUMMARY</Text>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>
              {reportSections.executive_summary || incident.description || 'No summary available.'}
            </Text>
          </View>
        </View>

        {/* 4. Incident Details */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>3. INCIDENT DETAILS</Text>
          <View style={styles.sectionContent}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Incident Type:</Text>
              <Text style={styles.fieldValue}>{incident.title}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Severity Level:</Text>
              <Text style={[styles.fieldValue, { fontWeight: 'bold', color: incident.severity === 'critical' ? '#c62828' : incident.severity === 'high' ? '#e65100' : '#333' }]}>
                {(incident.severity || 'medium').toUpperCase()}
              </Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Date of Occurrence:</Text>
              <Text style={styles.fieldValue}>{formatDate(incident.created_at)}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Location:</Text>
              <Text style={styles.fieldValue}>{incident.property_address || 'N/A'}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Report Status:</Text>
              <Text style={styles.fieldValue}>{(incident.status || 'draft').replace('_', ' ').toUpperCase()}</Text>
            </View>
            {aiAnalysis.detected_issues?.length > 0 && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Detected Issues:</Text>
                <Text style={styles.fieldValue}>{aiAnalysis.detected_issues.join(', ')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {company.name} | Confidential Incident Report | {incident.id?.substring(0, 8).toUpperCase()}
          </Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* Evidence & Media Page */}
      {images.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>4. EVIDENCE & MEDIA ({images.length} items)</Text>
            <View style={styles.sectionContent}>
              {images.map((image, index) => (
                <View key={image.id} style={styles.evidenceItem}>
                  {image.url && (
                    <Image src={image.url} style={styles.evidenceImage} />
                  )}
                  <View style={styles.evidenceDetails}>
                    <Text style={styles.evidenceCaption}>
                      Evidence #{index + 1}: {image.caption || image.filename}
                    </Text>
                    <Text style={styles.evidenceMeta}>
                      Uploaded: {formatDate(image.uploaded_at)}
                    </Text>
                    {image.ai_analysis?.severity && (
                      <Text style={styles.evidenceMeta}>
                        AI Severity: {image.ai_analysis.severity.toUpperCase()} | 
                        Confidence: {Math.round((image.ai_analysis.confidence || 0) * 100)}%
                      </Text>
                    )}
                    {image.ai_analysis?.detected_issues?.length > 0 && (
                      <Text style={styles.evidenceMeta}>
                        Detected: {image.ai_analysis.detected_issues.slice(0, 3).join(', ')}
                      </Text>
                    )}
                    {image.exif_data?.gps_lat && (
                      <Text style={styles.evidenceMeta}>
                        GPS: {image.exif_data.gps_lat}, {image.exif_data.gps_lng}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>
              {company.name} | Confidential Incident Report | {incident.id?.substring(0, 8).toUpperCase()}
            </Text>
            <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          </View>
        </Page>
      )}

      {/* Findings & Analysis Page */}
      <Page size="A4" style={styles.page}>
        {/* 5. Timeline */}
        {timeline.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>5. TIMELINE OF EVENTS</Text>
            <View style={styles.sectionContent}>
              {timeline.map((event: any, index: number) => (
                <View key={index} style={styles.timelineItem}>
                  <Text style={styles.timelineTime}>{event.date || `Event ${index + 1}`}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.timelineEvent}>{event.event}</Text>
                    {event.source && <Text style={styles.timelineSource}>Source: {event.source}</Text>}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 6. Findings & Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>6. FINDINGS & ANALYSIS</Text>
          <View style={styles.sectionContent}>
            {reportSections.findings?.length > 0 ? (
              reportSections.findings.map((finding: any, index: number) => (
                <View 
                  key={index} 
                  style={[
                    styles.findingItem,
                    { borderLeftColor: finding.severity === 'critical' ? '#9c27b0' : finding.severity === 'high' ? '#f44336' : finding.severity === 'medium' ? '#ff9800' : '#4caf50' }
                  ]}
                >
                  <View style={styles.findingHeader}>
                    <Text style={styles.findingTitle}>{finding.issue}</Text>
                    <Text style={[styles.findingSeverity, getSeverityStyle(finding.severity)]}>
                      {(finding.severity || 'medium').toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.findingDescription}>{finding.description}</Text>
                  {finding.recommended_action && (
                    <Text style={styles.findingAction}>
                      → Recommended: {finding.recommended_action}
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <Text style={{ fontSize: 9, color: '#666', fontStyle: 'italic' }}>
                No specific findings documented.
              </Text>
            )}
          </View>
        </View>

        {/* 7. Risk Assessment */}
        {reportSections.overall_risk_assessment && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>7. RISK ASSESSMENT</Text>
            <View style={styles.summaryBox}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Overall Risk Level:</Text>
                <Text style={[styles.fieldValue, { fontWeight: 'bold' }]}>
                  {reportSections.overall_risk_assessment.level?.toUpperCase() || 'MEDIUM'}
                </Text>
              </View>
              <Text style={{ fontSize: 9, marginTop: 6 }}>
                {reportSections.overall_risk_assessment.summary}
              </Text>
              {reportSections.overall_risk_assessment.immediate_concerns?.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#c62828' }}>Immediate Concerns:</Text>
                  {reportSections.overall_risk_assessment.immediate_concerns.map((concern: string, i: number) => (
                    <Text key={i} style={{ fontSize: 8, marginLeft: 10 }}>• {concern}</Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* 8. Recommendations */}
        {reportSections.recommendations?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>8. RECOMMENDATIONS</Text>
            <View style={styles.sectionContent}>
              {reportSections.recommendations.map((rec: any, index: number) => (
                <View key={index} style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold' }}>
                    {rec.priority}. {rec.action}
                  </Text>
                  <Text style={{ fontSize: 8, color: '#666', marginLeft: 15 }}>
                    Urgency: {rec.estimated_urgency?.replace('_', ' ').toUpperCase()} | {rec.reason}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {company.name} | Confidential Incident Report | {incident.id?.substring(0, 8).toUpperCase()}
          </Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* Liability & Signature Page */}
      <Page size="A4" style={styles.page}>
        {/* 9. Liability Statement */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>9. LIABILITY STATEMENT & LEGAL NOTICE</Text>
          <View style={styles.liabilityBox}>
            <Text style={styles.liabilityTitle}>IMPORTANT NOTICE</Text>
            <Text style={styles.liabilityText}>
              {reportSections.liability_statement || 
                `This report documents observed conditions and timeline at the property located at ${incident.property_address || 'the specified address'}. The findings contained herein are based on visual inspection and AI-assisted analysis conducted on ${formatShortDate(incident.created_at)}.

By signing below, the undersigned acknowledges receipt and review of these findings. This acknowledgment is not an admission of fault, liability, or responsibility by either party. The documented conditions represent the state observed at the time of inspection and may not reflect current conditions.

Any disputes arising from this report shall be governed by the laws of the applicable jurisdiction. Both parties agree to attempt resolution through mediation before pursuing legal action.

This document has been generated and secured using SHA-256 cryptographic hashing to ensure document integrity and prevent tampering.`}
            </Text>
          </View>
        </View>

        {/* 10. Customer Response & Acknowledgment */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>10. CUSTOMER RESPONSE & ACKNOWLEDGMENT</Text>
          
          {incident.signed_at ? (
            incident.signature_type === 'acknowledged' ? (
              <View style={styles.digitalSignature}>
                <Text style={styles.digitalSignatureTitle}>✓ DOCUMENT ACKNOWLEDGED</Text>
                <Text style={styles.digitalSignatureDetails}>
                  Signed by: {incident.signer_name}
                </Text>
                <Text style={styles.digitalSignatureDetails}>
                  Date/Time: {formatDate(incident.signed_at)}
                </Text>
                <Text style={styles.digitalSignatureDetails}>
                  IP Address: {incident.signer_ip || 'Recorded'}
                </Text>
                <Text style={styles.digitalSignatureDetails}>
                  Verification: Digital signature captured via secure web portal
                </Text>
              </View>
            ) : (
              <View style={styles.refusalBox}>
                <Text style={styles.refusalTitle}>✗ ACKNOWLEDGMENT REFUSED</Text>
                <Text style={styles.refusalText}>
                  Refused by: {incident.signer_name}
                </Text>
                <Text style={styles.refusalText}>
                  Date/Time: {formatDate(incident.signed_at)}
                </Text>
                <Text style={styles.refusalText}>
                  Reason: {incident.refusal_reason || 'Not specified'}
                </Text>
                <Text style={styles.refusalText}>
                  IP Address: {incident.signer_ip || 'Recorded'}
                </Text>
              </View>
            )
          ) : (
            <View style={styles.sectionContent}>
              <Text style={{ fontSize: 9, marginBottom: 15 }}>
                By signing below, I acknowledge that I have reviewed the findings documented in this report.
              </Text>
              
              <View style={styles.signatureBox}>
                <View style={styles.signatureBlock}>
                  <Text style={styles.signatureLabel}>Client Signature</Text>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureName}>{incident.customer_name || '________________________'}</Text>
                  <Text style={styles.signatureDate}>Date: ____________________</Text>
                </View>
                <View style={styles.signatureBlock}>
                  <Text style={styles.signatureLabel}>Witness Signature (if applicable)</Text>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureName}>________________________</Text>
                  <Text style={styles.signatureDate}>Date: ____________________</Text>
                </View>
              </View>
              
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 8, marginBottom: 4 }}>☐ I ACKNOWLEDGE receipt and review of this incident report</Text>
                <Text style={{ fontSize: 8 }}>☐ I REFUSE to acknowledge this report (reason required below):</Text>
                <View style={{ borderWidth: 1, borderColor: '#ccc', height: 40, marginTop: 5 }} />
              </View>
            </View>
          )}
        </View>

        {/* 11. Technician Signature */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>11. REPORT AUTHOR & VERIFICATION</Text>
          <View style={styles.sectionContent}>
            <View style={styles.signatureBox}>
              <View style={styles.signatureBlock}>
                <Text style={styles.signatureLabel}>Technician / Report Author</Text>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureName}>________________________</Text>
                <Text style={styles.signatureDate}>Role: ____________________</Text>
                <Text style={styles.signatureDate}>Date: ____________________</Text>
              </View>
              <View style={styles.signatureBlock}>
                <Text style={styles.signatureLabel}>Supervisor / Approver</Text>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureName}>________________________</Text>
                <Text style={styles.signatureDate}>Date: ____________________</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {company.name} | Confidential Incident Report | {incident.id?.substring(0, 8).toUpperCase()}
          </Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* Audit & Appendix Page */}
      <Page size="A4" style={styles.page}>
        {/* 12. Audit Metadata */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>12. AUDIT METADATA & CHAIN OF CUSTODY</Text>
          <View style={styles.auditSection}>
            <Text style={styles.auditTitle}>Document Integrity</Text>
            <Text style={styles.auditItem}>Document Hash (SHA-256): {incident.pdf_hash || 'Generated on finalization'}</Text>
            <Text style={styles.auditItem}>Report ID: {incident.id}</Text>
            <Text style={styles.auditItem}>Created: {formatDate(incident.created_at)}</Text>
            <Text style={styles.auditItem}>Last Modified: {formatDate(incident.updated_at)}</Text>
            {incident.finalized_at && (
              <Text style={styles.auditItem}>Finalized: {formatDate(incident.finalized_at)}</Text>
            )}
            
            {signatureEvents.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.auditTitle}>Event Log</Text>
                {signatureEvents.slice(0, 10).map((event, index) => (
                  <Text key={index} style={styles.auditItem}>
                    {formatDate(event.occurred_at)} | {event.event_type} | IP: {event.ip_address || 'N/A'}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* 13. Appendix */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>13. APPENDIX & ATTACHMENTS</Text>
          <View style={styles.sectionContent}>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCellSmall}>#</Text>
                <Text style={styles.tableCell}>Attachment</Text>
                <Text style={styles.tableCell}>Type</Text>
                <Text style={styles.tableCellSmall}>Size</Text>
              </View>
              {images.map((image, index) => (
                <View key={image.id} style={styles.tableRow}>
                  <Text style={styles.tableCellSmall}>{index + 1}</Text>
                  <Text style={styles.tableCell}>{image.filename}</Text>
                  <Text style={styles.tableCell}>{image.mime_type || 'image/jpeg'}</Text>
                  <Text style={styles.tableCellSmall}>{Math.round((image.file_size || 0) / 1024)} KB</Text>
                </View>
              ))}
            </View>
            {images.length === 0 && (
              <Text style={{ fontSize: 9, color: '#666', fontStyle: 'italic' }}>
                No attachments included with this report.
              </Text>
            )}
          </View>
        </View>

        {/* 14. Footer / Legal & Retention */}
        <View style={[styles.section, { marginTop: 20 }]}>
          <Text style={styles.sectionHeader}>14. DATA RETENTION & LEGAL</Text>
          <View style={styles.sectionContent}>
            <Text style={{ fontSize: 8, lineHeight: 1.5, color: '#666' }}>
              This document is retained in accordance with applicable data retention policies. Records are maintained for a minimum of 7 years from the date of creation unless otherwise required by law or contractual obligation.
              {'\n\n'}
              For questions or disputes regarding this report, contact: {company.email}
              {'\n\n'}
              © {new Date().getFullYear()} {company.name}. All rights reserved. This document contains confidential and proprietary information. Unauthorized reproduction or distribution is prohibited.
            </Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {company.name} | Confidential Incident Report | {incident.id?.substring(0, 8).toUpperCase()}
          </Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};

export default IncidentReportPDF;
