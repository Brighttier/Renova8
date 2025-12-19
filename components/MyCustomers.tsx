import React, { useState, useRef } from 'react';
import { Lead, Invoice, InvoiceItem, Communication, PaymentRecord } from '../types';
import { generateBrandAnalysis, generatePitchEmail, generateWebsiteConceptImage, promptForKeySelection } from '../services/geminiService';
import { ApiKeyModal } from './ApiKeyModal';

// Helper function to get invoice payment status
const getInvoicePaymentStatus = (invoice: Invoice): { status: 'paid' | 'partial' | 'unpaid' | 'overdue'; color: string; bgColor: string; label: string } => {
    const paidAmount = invoice.paidAmount || 0;
    const total = invoice.total || 0;
    const isOverdue = invoice.dueDate && invoice.dueDate < Date.now() && paidAmount < total;

    if (paidAmount >= total) {
        return { status: 'paid', color: 'text-green-700', bgColor: 'bg-green-100', label: 'Paid' };
    } else if (isOverdue) {
        return { status: 'overdue', color: 'text-red-700', bgColor: 'bg-red-100', label: 'Overdue' };
    } else if (paidAmount > 0) {
        return { status: 'partial', color: 'text-orange-700', bgColor: 'bg-orange-100', label: 'Partially Paid' };
    } else {
        return { status: 'unpaid', color: 'text-red-700', bgColor: 'bg-red-100', label: 'Unpaid' };
    }
};

// Helper to get remaining balance
const getInvoiceBalance = (invoice: Invoice): number => {
    return Math.max(0, (invoice.total || 0) - (invoice.paidAmount || 0));
};

interface Props {
  customers: Lead[];
  onUpdateCustomer: (lead: Lead) => void;
  onUseCredit: (amount: number) => void;
  onBuildWebsite: (lead: Lead) => void;
  onEditWebsite?: (lead: Lead) => void;
}

// Default invoice form state
const defaultInvoiceForm = {
  // Sender/Business Details (From)
  senderName: '',
  senderCompany: '',
  senderAddress: '',
  senderCity: '',
  senderPhone: '',
  senderEmail: '',
  senderWebsite: '',
  // Invoice Items
  items: [{ id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }] as InvoiceItem[],
  dueDate: '',
  billingPeriodStart: '',
  billingPeriodEnd: '',
  taxRate: 0,
  discount: 0,
  discountType: 'percentage' as 'percentage' | 'fixed',
  notes: '',
  terms: 'Payment is due within 30 days of invoice date. Late payments may incur additional charges.'
};

export const MyCustomers: React.FC<Props> = ({ customers, onUpdateCustomer, onUseCredit, onBuildWebsite, onEditWebsite }) => {
  const [selectedId, setSelectedId] = useState<string | null>(customers.length > 0 ? customers[0].id : null);
  const [loading, setLoading] = useState(false);
  const [pitchLoading, setPitchLoading] = useState(false);
  const [conceptLoading, setConceptLoading] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const invoicePreviewRef = useRef<HTMLDivElement>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({
      amount: 0,
      method: 'bank_transfer' as PaymentRecord['method'],
      reference: '',
      notes: ''
  });

  // Invoice form state
  const [invoiceForm, setInvoiceForm] = useState(defaultInvoiceForm);

  const selectedCustomer = customers.find(c => c.id === selectedId);

  // The Magic "One-Click" Setup
  const handleAutoPitchKit = async (skipKeyCheck = false) => {
      if (!selectedCustomer) return;
      setPitchLoading(true);

      try {
          onUseCredit(10);
          const branding = await generateBrandAnalysis(selectedCustomer.businessName, selectedCustomer.details);

          let conceptImage = selectedCustomer.websiteConceptImage;

          try {
             if (!conceptImage) {
                conceptImage = await generateWebsiteConceptImage(
                    `Homepage for ${selectedCustomer.businessName} (${selectedCustomer.details}). Colors: ${branding.colors?.join(', ')}`,
                    undefined,
                    undefined,
                    skipKeyCheck
                );
             }
          } catch (err: any) {
              if (err.message.includes("API_KEY_REQUIRED")) {
                  setPendingAction(() => () => handleAutoPitchKit(true));
                  setShowKeyModal(true);
                  setPitchLoading(false);
                  return;
              }
              console.warn("Image gen failed, proceeding with email only", err);
          }

          const email = await generatePitchEmail(
              selectedCustomer.businessName,
              selectedCustomer.websiteUrl,
              branding.tone || 'Professional',
              !!conceptImage
          );

          // Add communication record
          const newCommunication: Communication = {
              id: `comm-${Date.now()}`,
              type: 'email',
              subject: email.subject,
              content: email.body,
              timestamp: Date.now(),
              direction: 'outbound'
          };

          onUpdateCustomer({
              ...selectedCustomer,
              brandGuidelines: branding,
              websiteConceptImage: conceptImage,
              emailDraft: email,
              status: 'contacted',
              communications: [...(selectedCustomer.communications || []), newCommunication]
          });

      } catch (e) {
          console.error("Auto Pitch Failed", e);
          alert("Something went wrong creating the pitch kit.");
      } finally {
          setPitchLoading(false);
      }
  };

  const handleRegenerateConcept = async (skipKeyCheck = false) => {
      if (!selectedCustomer) return;
      setConceptLoading(true);
      try {
          onUseCredit(5);
          const branding = selectedCustomer.brandGuidelines;
          const tone = branding?.tone || 'Professional';
          const colors = branding?.colors?.join(', ') || 'Standard';

          const newImage = await generateWebsiteConceptImage(
             `Modern homepage website design for ${selectedCustomer.businessName}. Style: ${tone}. Colors: ${colors}. High quality UI/UX mockup.`,
             undefined,
             undefined,
             skipKeyCheck
          );

          onUpdateCustomer({
              ...selectedCustomer,
              websiteConceptImage: newImage
          });
      } catch (err: any) {
          if (err.message.includes("API_KEY_REQUIRED")) {
              setPendingAction(() => () => handleRegenerateConcept(true));
              setShowKeyModal(true);
          } else {
              console.error(err);
              alert("Failed to regenerate image.");
          }
      } finally {
          setConceptLoading(false);
      }
  }

  const handleKeyConfirm = async () => {
      setShowKeyModal(false);
      await promptForKeySelection();
      if (pendingAction) {
          pendingAction();
          setPendingAction(null);
      }
  }

  const handleEmailEdit = (field: 'subject' | 'body', value: string) => {
      if (!selectedCustomer || !selectedCustomer.emailDraft) return;
      onUpdateCustomer({
          ...selectedCustomer,
          emailDraft: {
              ...selectedCustomer.emailDraft,
              [field]: value
          }
      });
  }

  const toggleConverted = () => {
      if (!selectedCustomer) return;
      onUpdateCustomer({
          ...selectedCustomer,
          status: selectedCustomer.status === 'converted' ? 'contacted' : 'converted'
      });
  }

  // Calculate invoice totals
  const calculateInvoiceTotals = () => {
      const subtotal = invoiceForm.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const discountAmount = invoiceForm.discountType === 'percentage'
          ? subtotal * (invoiceForm.discount / 100)
          : invoiceForm.discount;
      const afterDiscount = subtotal - discountAmount;
      const taxAmount = afterDiscount * (invoiceForm.taxRate / 100);
      const total = afterDiscount + taxAmount;
      return { subtotal, discountAmount, taxAmount, total };
  };

  // Add line item
  const addLineItem = () => {
      setInvoiceForm({
          ...invoiceForm,
          items: [...invoiceForm.items, { id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }]
      });
  };

  // Remove line item
  const removeLineItem = (itemId: string) => {
      if (invoiceForm.items.length <= 1) return;
      setInvoiceForm({
          ...invoiceForm,
          items: invoiceForm.items.filter(item => item.id !== itemId)
      });
  };

  // Update line item
  const updateLineItem = (itemId: string, field: keyof InvoiceItem, value: string | number) => {
      setInvoiceForm({
          ...invoiceForm,
          items: invoiceForm.items.map(item =>
              item.id === itemId ? { ...item, [field]: value } : item
          )
      });
  };

  // Add Invoice
  const handleAddInvoice = () => {
      if (!selectedCustomer || invoiceForm.items.every(item => !item.description)) return;

      const { subtotal, discountAmount, taxAmount, total } = calculateInvoiceTotals();

      const newInvoice: Invoice = {
          id: `inv-${Date.now()}`,
          invoiceNumber: `INV-${String(Date.now()).slice(-6)}`,
          amount: total,
          description: invoiceForm.items.map(i => i.description).filter(Boolean).join(', '),
          status: 'draft',
          createdAt: Date.now(),
          dueDate: invoiceForm.dueDate ? new Date(invoiceForm.dueDate).getTime() : undefined,
          items: invoiceForm.items.filter(item => item.description),
          subtotal,
          taxRate: invoiceForm.taxRate,
          taxAmount,
          discount: invoiceForm.discountType === 'percentage' ? invoiceForm.discount : discountAmount,
          discountType: invoiceForm.discountType,
          total,
          notes: invoiceForm.notes || undefined,
          terms: invoiceForm.terms || undefined,
          billingPeriod: invoiceForm.billingPeriodStart && invoiceForm.billingPeriodEnd ? {
              start: new Date(invoiceForm.billingPeriodStart).getTime(),
              end: new Date(invoiceForm.billingPeriodEnd).getTime()
          } : undefined,
          sender: (invoiceForm.senderName || invoiceForm.senderCompany) ? {
              name: invoiceForm.senderName || undefined,
              company: invoiceForm.senderCompany || undefined,
              address: invoiceForm.senderAddress || undefined,
              city: invoiceForm.senderCity || undefined,
              phone: invoiceForm.senderPhone || undefined,
              email: invoiceForm.senderEmail || undefined,
              website: invoiceForm.senderWebsite || undefined
          } : undefined,
          paidAmount: 0,
          payments: []
      };

      onUpdateCustomer({
          ...selectedCustomer,
          invoices: [...(selectedCustomer.invoices || []), newInvoice]
      });

      setInvoiceForm({
          ...defaultInvoiceForm,
          items: [{ id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }]
      });
      setShowInvoiceModal(false);
  };

  // Print invoice
  const handlePrintInvoice = () => {
      if (!invoicePreviewRef.current) return;
      const printContent = invoicePreviewRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
          printWindow.document.write(`
              <!DOCTYPE html>
              <html>
              <head>
                  <title>Invoice</title>
                  <style>
                      * { margin: 0; padding: 0; box-sizing: border-box; }
                      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                      .invoice-container { max-width: 800px; margin: 0 auto; }
                      @media print { body { padding: 20px; } }
                  </style>
              </head>
              <body>${printContent}</body>
              </html>
          `);
          printWindow.document.close();
          printWindow.print();
      }
  };

  // Generate Invoice Email
  const generateInvoiceEmail = (invoice: Invoice, customer: Lead) => {
      // Format billing period
      const billingPeriod = invoice.billingPeriod
          ? `${new Date(invoice.billingPeriod.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(invoice.billingPeriod.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
          : new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      // Format due date
      const dueDate = invoice.dueDate
          ? new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : 'Upon receipt';

      // Generate subject
      const subject = `Invoice ${invoice.invoiceNumber} for ${customer.businessName} – ${billingPeriod}`;

      // Sender info
      const senderCompany = invoice.sender?.company || invoice.sender?.name || 'Our Company';
      const senderName = invoice.sender?.name || '';
      const senderEmail = invoice.sender?.email || '';
      const senderPhone = invoice.sender?.phone || '';
      const senderAddress = invoice.sender?.address ? `${invoice.sender.address}${invoice.sender.city ? ', ' + invoice.sender.city : ''}` : '';

      // Items summary
      const itemsList = invoice.items?.map(item =>
          `  • ${item.description}: ${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.quantity * item.unitPrice)}`
      ).join('\n') || '';

      // Generate body
      const body = `Dear ${customer.businessName},

Thank you for your continued business. Please find below the details of your invoice.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INVOICE DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Invoice Number: ${invoice.invoiceNumber}
Invoice Date: ${new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
Billing Period: ${billingPeriod}
Payment Due Date: ${dueDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SERVICES/ITEMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${itemsList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAYMENT SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subtotal: ${formatCurrency(invoice.subtotal)}${invoice.discount > 0 ? `\nDiscount${invoice.discountType === 'percentage' ? ` (${invoice.discount}%)` : ''}: -${formatCurrency(invoice.discountType === 'percentage' ? invoice.subtotal * (invoice.discount / 100) : invoice.discount)}` : ''}${invoice.taxRate > 0 ? `\nTax (${invoice.taxRate}%): ${formatCurrency(invoice.taxAmount)}` : ''}

TOTAL AMOUNT DUE: ${formatCurrency(invoice.total)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${invoice.notes ? `Note: ${invoice.notes}\n\n` : ''}Please review the attached invoice PDF for complete details. If you have any questions regarding this invoice, please don't hesitate to contact us.

${invoice.terms ? `Terms & Conditions:\n${invoice.terms}\n\n` : ''}We appreciate your prompt payment.

Best regards,

${senderName ? senderName + '\n' : ''}${senderCompany}${senderAddress ? '\n' + senderAddress : ''}${senderPhone ? '\nPhone: ' + senderPhone : ''}${senderEmail ? '\nEmail: ' + senderEmail : ''}${invoice.sender?.website ? '\nWebsite: ' + invoice.sender.website : ''}

---
This invoice was generated using RenovateMySite.
Please remember to save the invoice PDF before sending.`;

      return { subject, body };
  };

  // Email Invoice
  const handleEmailInvoice = (invoice: Invoice) => {
      if (!selectedCustomer) return;

      const { subject, body } = generateInvoiceEmail(invoice, selectedCustomer);
      const customerEmail = selectedCustomer.email || '';

      // Create mailto link
      const mailtoLink = `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      // Open default mail client
      window.location.href = mailtoLink;

      // Record communication
      const newCommunication: Communication = {
          id: `comm-${Date.now()}`,
          type: 'email',
          subject: subject,
          content: `Invoice ${invoice.invoiceNumber} sent via email`,
          timestamp: Date.now(),
          direction: 'outbound'
      };

      onUpdateCustomer({
          ...selectedCustomer,
          communications: [...(selectedCustomer.communications || []), newCommunication]
      });
  };

  // Email Invoice from Create Form (preview)
  const handleEmailInvoicePreview = () => {
      if (!selectedCustomer) return;

      const { subtotal, discountAmount, taxAmount, total } = calculateInvoiceTotals();

      // Create a temporary invoice object for the email
      const tempInvoice: Invoice = {
          id: `temp-${Date.now()}`,
          invoiceNumber: `INV-${String(Date.now()).slice(-6)}`,
          amount: total,
          description: invoiceForm.items.map((i: { description: string }) => i.description).filter(Boolean).join(', '),
          status: 'draft',
          createdAt: Date.now(),
          dueDate: invoiceForm.dueDate ? new Date(invoiceForm.dueDate).getTime() : undefined,
          items: invoiceForm.items.filter((item: { description: string }) => item.description),
          subtotal,
          taxRate: invoiceForm.taxRate,
          taxAmount,
          discount: invoiceForm.discountType === 'percentage' ? invoiceForm.discount : discountAmount,
          discountType: invoiceForm.discountType,
          total,
          notes: invoiceForm.notes || undefined,
          terms: invoiceForm.terms || undefined,
          billingPeriod: invoiceForm.billingPeriodStart && invoiceForm.billingPeriodEnd ? {
              start: new Date(invoiceForm.billingPeriodStart).getTime(),
              end: new Date(invoiceForm.billingPeriodEnd).getTime()
          } : undefined,
          sender: (invoiceForm.senderName || invoiceForm.senderCompany) ? {
              name: invoiceForm.senderName || undefined,
              company: invoiceForm.senderCompany || undefined,
              address: invoiceForm.senderAddress || undefined,
              city: invoiceForm.senderCity || undefined,
              phone: invoiceForm.senderPhone || undefined,
              email: invoiceForm.senderEmail || undefined,
              website: invoiceForm.senderWebsite || undefined
          } : undefined,
          paidAmount: 0,
          payments: []
      };

      handleEmailInvoice(tempInvoice);
  };

  // Update Invoice Status
  const handleUpdateInvoiceStatus = (invoiceId: string, status: Invoice['status']) => {
      if (!selectedCustomer) return;
      const updatedInvoices = selectedCustomer.invoices?.map(inv => {
          if (inv.id !== invoiceId) return inv;

          // If marking as paid, set paidAmount to total
          if (status === 'paid') {
              const payment: PaymentRecord = {
                  id: `pay-${Date.now()}`,
                  amount: inv.total - (inv.paidAmount || 0),
                  date: Date.now(),
                  method: 'other',
                  notes: 'Marked as fully paid'
              };
              return {
                  ...inv,
                  status,
                  paidAt: Date.now(),
                  paidAmount: inv.total,
                  payments: [...(inv.payments || []), payment]
              };
          }
          return { ...inv, status };
      });
      onUpdateCustomer({
          ...selectedCustomer,
          invoices: updatedInvoices
      });
  };

  // Open payment modal for recording partial/full payment
  const handleOpenPaymentModal = (invoice: Invoice) => {
      setPaymentInvoice(invoice);
      setPaymentForm({
          amount: getInvoiceBalance(invoice),
          method: 'bank_transfer',
          reference: '',
          notes: ''
      });
      setShowPaymentModal(true);
  };

  // Record a payment
  const handleRecordPayment = () => {
      if (!selectedCustomer || !paymentInvoice || paymentForm.amount <= 0) return;

      const payment: PaymentRecord = {
          id: `pay-${Date.now()}`,
          amount: paymentForm.amount,
          date: Date.now(),
          method: paymentForm.method,
          reference: paymentForm.reference || undefined,
          notes: paymentForm.notes || undefined
      };

      const newPaidAmount = (paymentInvoice.paidAmount || 0) + paymentForm.amount;
      const isPaidInFull = newPaidAmount >= paymentInvoice.total;

      const updatedInvoices = selectedCustomer.invoices?.map(inv => {
          if (inv.id !== paymentInvoice.id) return inv;
          return {
              ...inv,
              paidAmount: newPaidAmount,
              payments: [...(inv.payments || []), payment],
              status: isPaidInFull ? 'paid' as const : 'partial' as const,
              paidAt: isPaidInFull ? Date.now() : inv.paidAt
          };
      });

      onUpdateCustomer({
          ...selectedCustomer,
          invoices: updatedInvoices
      });

      setShowPaymentModal(false);
      setPaymentInvoice(null);
  };

  // Quick Generate Email with Branding
  const handleQuickEmail = async () => {
      if (!selectedCustomer) return;
      setEmailLoading(true);
      try {
          onUseCredit(2);
          const email = await generatePitchEmail(
              selectedCustomer.businessName,
              selectedCustomer.websiteUrl,
              selectedCustomer.brandGuidelines?.tone || 'Professional',
              !!selectedCustomer.websiteConceptImage
          );

          const newCommunication: Communication = {
              id: `comm-${Date.now()}`,
              type: 'email',
              subject: email.subject,
              content: email.body,
              timestamp: Date.now(),
              direction: 'outbound'
          };

          onUpdateCustomer({
              ...selectedCustomer,
              emailDraft: email,
              communications: [...(selectedCustomer.communications || []), newCommunication]
          });
          setShowEmailModal(false);
      } catch (e) {
          console.error("Email generation failed", e);
          alert("Failed to generate email.");
      } finally {
          setEmailLoading(false);
      }
  };

  // Get all activity items sorted by date
  const getActivityItems = () => {
      if (!selectedCustomer) return [];
      const items: { type: string; date: number; data: any }[] = [];

      // Add invoices
      selectedCustomer.invoices?.forEach(inv => {
          items.push({ type: 'invoice', date: inv.createdAt, data: inv });
      });

      // Add communications
      selectedCustomer.communications?.forEach(comm => {
          items.push({ type: 'communication', date: comm.timestamp, data: comm });
      });

      // Add history items
      selectedCustomer.history?.forEach(hist => {
          items.push({ type: 'history', date: hist.timestamp, data: hist });
      });

      return items.sort((a, b) => b.date - a.date);
  };

  const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
      });
  };

  const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (customers.length === 0) {
      return (
          <div className="text-center py-20">
              <div className="bg-pink-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">👥</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">No customers yet!</h2>
              <p className="text-gray-500 mt-2">Go to "Find Customers" to start building your list.</p>
          </div>
      );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex gap-4">
        {showKeyModal && <ApiKeyModal onClose={() => setShowKeyModal(false)} onConfirm={handleKeyConfirm} />}

        {/* Column 1: Customer List */}
        <div className="w-1/4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-bold text-gray-700">My List ({customers.length})</h2>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-2">
                {customers.map(customer => (
                    <div
                        key={customer.id}
                        onClick={() => setSelectedId(customer.id)}
                        className={`p-3 rounded-xl cursor-pointer transition-all ${selectedId === customer.id ? 'bg-purple-50 border-purple-200 border' : 'hover:bg-gray-50 border border-transparent'}`}
                    >
                        <h3 className="font-bold text-gray-800 text-sm">{customer.businessName}</h3>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-500 truncate max-w-[100px]">{customer.location}</span>
                            {customer.status === 'converted' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Won</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Column 2: Customer Details */}
        <div className="w-2/5 flex flex-col gap-4 overflow-y-auto pb-10">
            {selectedCustomer ? (
                <>
                {/* Header */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-pink-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">{selectedCustomer.businessName}</h1>
                            <p className="text-gray-500 text-sm">{selectedCustomer.location}</p>
                            <div className="flex flex-col mt-2 gap-1">
                                {selectedCustomer.phone && (
                                    <div className="flex items-center text-xs text-gray-600">
                                        <span className="mr-2">📞</span> {selectedCustomer.phone}
                                    </div>
                                )}
                                {selectedCustomer.email && (
                                    <div className="flex items-center text-xs text-gray-600">
                                        <span className="mr-2">✉️</span> {selectedCustomer.email}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${selectedCustomer.status === 'converted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {selectedCustomer.status}
                            </span>
                            <button
                                onClick={toggleConverted}
                                className={`px-2 py-1 rounded-full text-xs font-bold border transition-colors ${selectedCustomer.status === 'converted' ? 'border-gray-200 text-gray-500' : 'border-green-200 text-green-600'}`}
                            >
                                {selectedCustomer.status === 'converted' ? 'Undo' : 'Won'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* AUTO PITCH ACTION */}
                {!selectedCustomer.brandGuidelines && (
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-5 text-white shadow-lg flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold mb-1">✨ Create Pitch Kit</h3>
                            <p className="text-purple-100 text-xs">Auto-generate Brand Analysis & Pitch Email.</p>
                        </div>
                        <button
                            onClick={() => handleAutoPitchKit(false)}
                            disabled={pitchLoading}
                            className="bg-white text-purple-600 px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-gray-50 disabled:opacity-75"
                        >
                            {pitchLoading ? 'Creating...' : 'Generate (10 Cr)'}
                        </button>
                    </div>
                )}

                {/* Brand DNA & Product Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Brand Analysis */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-700 mb-3 flex items-center text-sm">
                            <span className="bg-blue-100 p-1 rounded mr-2">🧬</span> Brand DNA
                        </h3>
                        {selectedCustomer.brandGuidelines ? (
                            <div className="space-y-3 text-xs">
                                <div>
                                    <span className="text-gray-500 font-bold uppercase">Tone</span>
                                    <p className="text-gray-800 font-medium">{selectedCustomer.brandGuidelines.tone}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500 font-bold uppercase">Colors</span>
                                    <div className="flex gap-1 mt-1">
                                        {selectedCustomer.brandGuidelines.colors?.map((c, i) => (
                                            <div key={i} className="w-6 h-6 rounded-full border" style={{ backgroundColor: c }}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-xs text-center py-4">Run Pitch Kit</p>
                        )}
                    </div>

                    {/* Website Action */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-700 mb-3 flex items-center text-sm">
                            <span className="bg-purple-100 p-1 rounded mr-2">💻</span> Product
                        </h3>
                        {selectedCustomer.websiteConceptImage ? (
                            <div>
                                <img src={selectedCustomer.websiteConceptImage} alt="Concept" className="w-full h-20 object-cover rounded-lg mb-2" />
                                <div className="flex gap-2">
                                    <button onClick={() => onBuildWebsite(selectedCustomer)} className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold">
                                        Open Builder
                                    </button>
                                    {onEditWebsite && (
                                        <button onClick={() => onEditWebsite(selectedCustomer)} className="flex-1 py-2 bg-[#D4AF37] text-white rounded-lg text-xs font-bold">
                                            Edit Website
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={() => onBuildWebsite(selectedCustomer)} className="flex-1 py-2 border border-purple-200 text-purple-600 rounded-lg text-xs font-bold">
                                    Manual Build
                                </button>
                                {onEditWebsite && (
                                    <button onClick={() => onEditWebsite(selectedCustomer)} className="flex-1 py-2 bg-[#D4AF37] text-white rounded-lg text-xs font-bold">
                                        Edit Website
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Email Card */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center text-sm">
                        <span className="bg-pink-100 p-1 rounded mr-2">💌</span> Pitch Email
                    </h3>
                    {selectedCustomer.emailDraft ? (
                        <div className="space-y-3">
                            <input
                                className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs font-bold"
                                value={selectedCustomer.emailDraft.subject}
                                onChange={(e) => handleEmailEdit('subject', e.target.value)}
                            />
                            <textarea
                                className="w-full h-24 bg-gray-50 border rounded-lg px-3 py-2 text-xs resize-none"
                                value={selectedCustomer.emailDraft.body}
                                onChange={(e) => handleEmailEdit('body', e.target.value)}
                            />
                            <a
                                href={`mailto:${selectedCustomer.email}?subject=${encodeURIComponent(selectedCustomer.emailDraft.subject)}&body=${encodeURIComponent(selectedCustomer.emailDraft.body)}`}
                                className="block w-full py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-bold text-center text-xs"
                            >
                                🚀 Open in Mail App
                            </a>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-xs text-center py-4">Run Pitch Kit to draft email</p>
                    )}
                </div>
                </>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-400">Select a customer</div>
            )}
        </div>

        {/* Column 3: Activity & History Panel */}
        <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h2 className="font-bold text-gray-700">Activity & History</h2>
                {selectedCustomer && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowInvoiceModal(true)}
                            className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600"
                        >
                            + Invoice
                        </button>
                        <button
                            onClick={() => setShowEmailModal(true)}
                            className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-bold hover:bg-purple-600"
                        >
                            + Email
                        </button>
                    </div>
                )}
            </div>

            {selectedCustomer ? (
                <div className="overflow-y-auto flex-1 p-4 space-y-3">
                    {/* Payment Details Panel */}
                    {(() => {
                        const invoices = selectedCustomer.invoices || [];

                        // Calculate financial summary
                        const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
                        const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
                        const totalUnpaid = totalInvoiced - totalPaid;

                        // Calculate overdue amount
                        const now = Date.now();
                        const overdueInvoices = invoices.filter(inv =>
                            inv.dueDate && inv.dueDate < now && (inv.paidAmount || 0) < inv.total
                        );
                        const overdueAmount = overdueInvoices.reduce((sum, inv) =>
                            sum + (inv.total - (inv.paidAmount || 0)), 0
                        );

                        // Find nearest due date (upcoming or overdue)
                        const unpaidInvoices = invoices.filter(inv => (inv.paidAmount || 0) < inv.total && inv.dueDate);
                        const sortedByDueDate = unpaidInvoices.sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
                        const nearestDueDate = sortedByDueDate[0]?.dueDate;
                        const isOverdue = nearestDueDate && nearestDueDate < now;

                        // Calculate payment health percentage
                        const paymentHealth = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 100;

                        return (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4 overflow-hidden">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3">
                                    <h3 className="text-white font-bold text-sm flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        Payment Details
                                    </h3>
                                </div>

                                {/* Payment Health Bar */}
                                <div className="px-4 pt-4 pb-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-gray-500">Payment Health</span>
                                        <span className={`text-xs font-bold ${
                                            paymentHealth >= 80 ? 'text-green-600' :
                                            paymentHealth >= 50 ? 'text-yellow-600' :
                                            'text-red-600'
                                        }`}>
                                            {paymentHealth.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all ${
                                                paymentHealth >= 80 ? 'bg-green-500' :
                                                paymentHealth >= 50 ? 'bg-yellow-500' :
                                                'bg-red-500'
                                            }`}
                                            style={{ width: `${paymentHealth}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Financial Summary Grid */}
                                <div className="p-4 grid grid-cols-2 gap-3">
                                    {/* Total Paid */}
                                    <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <span className="text-xs font-medium text-green-700">Total Paid</span>
                                        </div>
                                        <div className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</div>
                                    </div>

                                    {/* Unpaid Amount */}
                                    <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <span className="text-xs font-medium text-orange-700">Unpaid</span>
                                        </div>
                                        <div className="text-lg font-bold text-orange-600">{formatCurrency(totalUnpaid)}</div>
                                    </div>

                                    {/* Overdue Amount */}
                                    <div className={`rounded-xl p-3 border ${
                                        overdueAmount > 0
                                            ? 'bg-red-50 border-red-100'
                                            : 'bg-gray-50 border-gray-100'
                                    }`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                                overdueAmount > 0 ? 'bg-red-500' : 'bg-gray-400'
                                            }`}>
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                            <span className={`text-xs font-medium ${
                                                overdueAmount > 0 ? 'text-red-700' : 'text-gray-600'
                                            }`}>Overdue</span>
                                        </div>
                                        <div className={`text-lg font-bold ${
                                            overdueAmount > 0 ? 'text-red-600' : 'text-gray-400'
                                        }`}>
                                            {formatCurrency(overdueAmount)}
                                        </div>
                                        {overdueAmount > 0 && (
                                            <span className="text-xs text-red-500 font-medium animate-pulse">
                                                {overdueInvoices.length} invoice{overdueInvoices.length > 1 ? 's' : ''} overdue
                                            </span>
                                        )}
                                    </div>

                                    {/* Due Date */}
                                    <div className={`rounded-xl p-3 border ${
                                        isOverdue
                                            ? 'bg-red-50 border-red-100'
                                            : nearestDueDate
                                                ? 'bg-blue-50 border-blue-100'
                                                : 'bg-gray-50 border-gray-100'
                                    }`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                                isOverdue ? 'bg-red-500' : nearestDueDate ? 'bg-blue-500' : 'bg-gray-400'
                                            }`}>
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <span className={`text-xs font-medium ${
                                                isOverdue ? 'text-red-700' : nearestDueDate ? 'text-blue-700' : 'text-gray-600'
                                            }`}>
                                                {isOverdue ? 'Past Due' : 'Next Due'}
                                            </span>
                                        </div>
                                        {nearestDueDate ? (
                                            <>
                                                <div className={`text-sm font-bold ${
                                                    isOverdue ? 'text-red-600' : 'text-blue-600'
                                                }`}>
                                                    {new Date(nearestDueDate).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                                {isOverdue && (
                                                    <span className="text-xs text-red-500 font-medium">
                                                        {Math.ceil((now - nearestDueDate) / (1000 * 60 * 60 * 24))} days overdue
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-sm font-bold text-gray-400">No due dates</div>
                                        )}
                                    </div>
                                </div>

                                {/* Total Summary Row */}
                                <div className="px-4 pb-4">
                                    <div className="bg-slate-100 rounded-xl p-3 flex justify-between items-center">
                                        <div>
                                            <span className="text-xs text-slate-600">Total Invoiced</span>
                                            <div className="text-lg font-bold text-slate-800">{formatCurrency(totalInvoiced)}</div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-slate-600">{invoices.length} Invoice{invoices.length !== 1 ? 's' : ''}</span>
                                            <div className="flex items-center gap-1 mt-1">
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                    {invoices.filter(i => (i.paidAmount || 0) >= i.total).length} Paid
                                                </span>
                                                {invoices.filter(i => (i.paidAmount || 0) < i.total).length > 0 && (
                                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                                        {invoices.filter(i => (i.paidAmount || 0) < i.total).length} Pending
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="px-4 pb-4 flex gap-2">
                                    <div className="flex-1 bg-blue-50 rounded-lg p-2 text-center">
                                        <span className="text-xs text-blue-600">{selectedCustomer.communications?.length || 0}</span>
                                        <p className="text-xs text-blue-700 font-medium">Emails</p>
                                    </div>
                                    <div className="flex-1 bg-purple-50 rounded-lg p-2 text-center">
                                        <span className="text-xs text-purple-600">{invoices.reduce((sum, inv) => sum + (inv.payments?.length || 0), 0)}</span>
                                        <p className="text-xs text-purple-700 font-medium">Payments</p>
                                    </div>
                                    <div className="flex-1 bg-pink-50 rounded-lg p-2 text-center">
                                        <span className="text-xs text-pink-600">{selectedCustomer.history?.length || 0}</span>
                                        <p className="text-xs text-pink-700 font-medium">Activities</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Activity Timeline */}
                    {getActivityItems().length > 0 ? (
                        <div className="space-y-3">
                            {getActivityItems().map((item, idx) => (
                                <div key={idx} className="border border-gray-100 rounded-xl p-3 hover:bg-gray-50 transition-colors">
                                    {item.type === 'invoice' && (() => {
                                        const paymentStatus = getInvoicePaymentStatus(item.data);
                                        const balance = getInvoiceBalance(item.data);
                                        return (
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <div
                                                    className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                                                    onClick={() => setViewingInvoice(item.data)}
                                                >
                                                    <span className={`${paymentStatus.bgColor} ${paymentStatus.color} p-1.5 rounded`}>💰</span>
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-sm">{item.data.invoiceNumber}</p>
                                                        <p className="text-xs text-gray-500">{item.data.description}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${paymentStatus.bgColor} ${paymentStatus.color}`}>
                                                    {paymentStatus.label}
                                                </span>
                                            </div>
                                            {/* Payment Progress */}
                                            <div className="mb-2">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-500">
                                                        Paid: {formatCurrency(item.data.paidAmount || 0)} / {formatCurrency(item.data.total || 0)}
                                                    </span>
                                                    {balance > 0 && (
                                                        <span className="text-orange-600 font-medium">
                                                            Balance: {formatCurrency(balance)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full transition-all ${
                                                            paymentStatus.status === 'paid' ? 'bg-green-500' :
                                                            paymentStatus.status === 'partial' ? 'bg-orange-500' :
                                                            'bg-red-300'
                                                        }`}
                                                        style={{ width: `${Math.min(100, ((item.data.paidAmount || 0) / (item.data.total || 1)) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-gray-800">{formatCurrency(item.data.total || item.data.amount || 0)}</span>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => setViewingInvoice(item.data)}
                                                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
                                                    >
                                                        View
                                                    </button>
                                                    {paymentStatus.status !== 'paid' && (
                                                        <>
                                                            {item.data.status === 'draft' && (
                                                                <button
                                                                    onClick={() => handleUpdateInvoiceStatus(item.data.id, 'sent')}
                                                                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                                                                >
                                                                    Send
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleOpenPaymentModal(item.data)}
                                                                className="px-2 py-1 bg-purple-500 text-white rounded text-xs"
                                                            >
                                                                Record Payment
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">{formatDate(item.data.createdAt)}</p>
                                        </div>
                                        );
                                    })()}

                                    {item.type === 'communication' && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-purple-100 text-purple-600 p-1.5 rounded">
                                                    {item.data.type === 'email' ? '✉️' : item.data.type === 'call' ? '📞' : '📝'}
                                                </span>
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-800 text-sm">{item.data.subject}</p>
                                                    <p className="text-xs text-gray-500 line-clamp-2">{item.data.content}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400">{formatDate(item.data.timestamp)}</p>
                                        </div>
                                    )}

                                    {item.type === 'history' && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-blue-100 text-blue-600 p-1.5 rounded">
                                                    {item.data.type === 'WEBSITE_DEPLOY' ? '🌐' :
                                                     item.data.type === 'WEBSITE_CONCEPT' ? '🎨' :
                                                     item.data.type === 'STRATEGY' ? '📈' : '📄'}
                                                </span>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">{item.data.type.replace(/_/g, ' ')}</p>
                                                    <p className="text-xs text-gray-500">{item.data.metadata?.description || 'Activity recorded'}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400">{formatDate(item.data.timestamp)}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <span className="text-3xl block mb-2 opacity-30">📋</span>
                            <p className="text-gray-400 text-sm">No activity yet</p>
                            <p className="text-gray-400 text-xs">Add invoices or generate emails to track history</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex items-center justify-center flex-1 p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-gray-700 mb-1">Select a Customer</h3>
                        <p className="text-sm text-gray-400 mb-4">Choose a customer from the list to view their payment details, invoices, and activity history.</p>
                        <div className="flex justify-center gap-2">
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                Payment Details
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                Invoices
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                                History
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Professional Invoice Modal */}
        {showInvoiceModal && selectedCustomer && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex">
                    {/* Left Side - Invoice Form */}
                    <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">Create Invoice</h3>
                            <button
                                onClick={() => setShowInvoiceModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Sender/From Details */}
                        <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                            <label className="text-xs font-bold text-purple-700 uppercase mb-3 block flex items-center gap-2">
                                <span className="bg-purple-200 p-1 rounded">🏢</span> From (Your Business Details)
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Your Name / Contact</label>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        className="w-full px-3 py-2 border rounded-lg text-sm"
                                        value={invoiceForm.senderName}
                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, senderName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Company Name</label>
                                    <input
                                        type="text"
                                        placeholder="Your Company LLC"
                                        className="w-full px-3 py-2 border rounded-lg text-sm"
                                        value={invoiceForm.senderCompany}
                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, senderCompany: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-gray-500 mb-1 block">Address</label>
                                    <input
                                        type="text"
                                        placeholder="123 Business Street"
                                        className="w-full px-3 py-2 border rounded-lg text-sm"
                                        value={invoiceForm.senderAddress}
                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, senderAddress: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">City, State, ZIP</label>
                                    <input
                                        type="text"
                                        placeholder="New York, NY 10001"
                                        className="w-full px-3 py-2 border rounded-lg text-sm"
                                        value={invoiceForm.senderCity}
                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, senderCity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                                    <input
                                        type="tel"
                                        placeholder="+1 (555) 123-4567"
                                        className="w-full px-3 py-2 border rounded-lg text-sm"
                                        value={invoiceForm.senderPhone}
                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, senderPhone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Email</label>
                                    <input
                                        type="email"
                                        placeholder="billing@yourcompany.com"
                                        className="w-full px-3 py-2 border rounded-lg text-sm"
                                        value={invoiceForm.senderEmail}
                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, senderEmail: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Website (Optional)</label>
                                    <input
                                        type="url"
                                        placeholder="www.yourcompany.com"
                                        className="w-full px-3 py-2 border rounded-lg text-sm"
                                        value={invoiceForm.senderWebsite}
                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, senderWebsite: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Billing Period */}
                        <div className="mb-6">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Billing Period (Optional)</label>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="date"
                                    className="px-3 py-2 border rounded-lg text-sm"
                                    value={invoiceForm.billingPeriodStart}
                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, billingPeriodStart: e.target.value })}
                                    placeholder="Start Date"
                                />
                                <input
                                    type="date"
                                    className="px-3 py-2 border rounded-lg text-sm"
                                    value={invoiceForm.billingPeriodEnd}
                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, billingPeriodEnd: e.target.value })}
                                    placeholder="End Date"
                                />
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="mb-6">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Due Date</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                value={invoiceForm.dueDate}
                                onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                            />
                        </div>

                        {/* Line Items */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-xs font-bold text-gray-500 uppercase">Services / Products</label>
                                <button
                                    onClick={addLineItem}
                                    className="text-xs bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-bold hover:bg-purple-200"
                                >
                                    + Add Item
                                </button>
                            </div>
                            <div className="space-y-3">
                                {invoiceForm.items.map((item, idx) => (
                                    <div key={item.id} className="bg-gray-50 rounded-xl p-3">
                                        <div className="flex gap-2 items-start">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Description (e.g., Website Development)"
                                                    className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
                                                    value={item.description}
                                                    onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                                />
                                                <div className="flex gap-2">
                                                    <div className="w-24">
                                                        <label className="text-xs text-gray-400 mb-1 block">Qty</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="w-full px-2 py-1.5 border rounded-lg text-sm"
                                                            value={item.quantity}
                                                            onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="text-xs text-gray-400 mb-1 block">Unit Price ($)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className="w-full px-2 py-1.5 border rounded-lg text-sm"
                                                            value={item.unitPrice}
                                                            onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                    <div className="w-24">
                                                        <label className="text-xs text-gray-400 mb-1 block">Total</label>
                                                        <div className="px-2 py-1.5 bg-gray-100 rounded-lg text-sm font-bold text-gray-700">
                                                            {formatCurrency(item.quantity * item.unitPrice)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {invoiceForm.items.length > 1 && (
                                                <button
                                                    onClick={() => removeLineItem(item.id)}
                                                    className="text-red-400 hover:text-red-600 mt-2"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tax & Discount */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Tax Rate (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                    value={invoiceForm.taxRate}
                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, taxRate: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Discount</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                        value={invoiceForm.discount}
                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: parseFloat(e.target.value) || 0 })}
                                    />
                                    <select
                                        className="px-2 py-2 border rounded-lg text-sm bg-white"
                                        value={invoiceForm.discountType}
                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, discountType: e.target.value as 'percentage' | 'fixed' })}
                                    >
                                        <option value="percentage">%</option>
                                        <option value="fixed">$</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mb-6">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Notes (Optional)</label>
                            <textarea
                                className="w-full px-3 py-2 border rounded-lg text-sm resize-none h-20"
                                placeholder="Additional notes for the client..."
                                value={invoiceForm.notes}
                                onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                            />
                        </div>

                        {/* Terms */}
                        <div className="mb-6">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Terms & Conditions</label>
                            <textarea
                                className="w-full px-3 py-2 border rounded-lg text-sm resize-none h-20"
                                value={invoiceForm.terms}
                                onChange={(e) => setInvoiceForm({ ...invoiceForm, terms: e.target.value })}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowInvoiceModal(false)}
                                className="py-3 px-4 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEmailInvoicePreview}
                                disabled={invoiceForm.items.every(item => !item.description)}
                                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Email Invoice
                            </button>
                            <button
                                onClick={handleAddInvoice}
                                disabled={invoiceForm.items.every(item => !item.description)}
                                className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Create Invoice
                            </button>
                        </div>
                    </div>

                    {/* Right Side - Live Invoice Preview */}
                    <div className="w-1/2 bg-gray-50 p-6 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-gray-500 uppercase">Live Preview</h4>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleEmailInvoicePreview}
                                    disabled={invoiceForm.items.every(item => !item.description)}
                                    className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Email
                                </button>
                                <button
                                    onClick={handlePrintInvoice}
                                    className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-300 flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Print
                                </button>
                            </div>
                        </div>

                        {/* Invoice Preview Card */}
                        <div ref={invoicePreviewRef} className="bg-white rounded-xl shadow-lg overflow-hidden">
                            {/* Brand Header with Sender Info */}
                            <div
                                className="p-6"
                                style={{
                                    background: selectedCustomer.brandGuidelines?.colors?.[0]
                                        ? `linear-gradient(135deg, ${selectedCustomer.brandGuidelines.colors[0]}, ${selectedCustomer.brandGuidelines.colors[1] || selectedCustomer.brandGuidelines.colors[0]})`
                                        : 'linear-gradient(135deg, #667eea, #764ba2)'
                                }}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        {/* Sender/From Details */}
                                        {(invoiceForm.senderCompany || invoiceForm.senderName) ? (
                                            <>
                                                <h1 className="text-2xl font-bold text-white">{invoiceForm.senderCompany || invoiceForm.senderName}</h1>
                                                {invoiceForm.senderCompany && invoiceForm.senderName && (
                                                    <p className="text-white/80 text-sm">{invoiceForm.senderName}</p>
                                                )}
                                                {invoiceForm.senderAddress && <p className="text-white/70 text-xs mt-1">{invoiceForm.senderAddress}</p>}
                                                {invoiceForm.senderCity && <p className="text-white/70 text-xs">{invoiceForm.senderCity}</p>}
                                                {invoiceForm.senderPhone && <p className="text-white/70 text-xs mt-1">{invoiceForm.senderPhone}</p>}
                                                {invoiceForm.senderEmail && <p className="text-white/70 text-xs">{invoiceForm.senderEmail}</p>}
                                                {invoiceForm.senderWebsite && <p className="text-white/70 text-xs">{invoiceForm.senderWebsite}</p>}
                                            </>
                                        ) : (
                                            <div className="text-white/60 italic text-sm">
                                                <p>Your Business Name</p>
                                                <p className="text-xs">Add sender details in the form</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                                            <p className="text-white/80 text-xs uppercase font-bold">Invoice</p>
                                            <p className="text-white text-lg font-bold">INV-{String(Date.now()).slice(-6)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Invoice Details */}
                            <div className="p-6">
                                {/* Dates Row */}
                                <div className="flex justify-between mb-6 text-sm">
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase font-bold">Invoice Date</p>
                                        <p className="text-gray-800 font-medium">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                    </div>
                                    {invoiceForm.dueDate && (
                                        <div className="text-right">
                                            <p className="text-gray-400 text-xs uppercase font-bold">Due Date</p>
                                            <p className="text-gray-800 font-medium">{new Date(invoiceForm.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Billing Period */}
                                {invoiceForm.billingPeriodStart && invoiceForm.billingPeriodEnd && (
                                    <div className="mb-6 bg-gray-50 rounded-lg p-3">
                                        <p className="text-gray-400 text-xs uppercase font-bold mb-1">Billing Period</p>
                                        <p className="text-gray-800 text-sm">
                                            {new Date(invoiceForm.billingPeriodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            {' - '}
                                            {new Date(invoiceForm.billingPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                )}

                                {/* Billed To (Customer/Client) */}
                                <div className="mb-6">
                                    <p className="text-gray-400 text-xs uppercase font-bold mb-2">Bill To</p>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-gray-800 font-bold">{selectedCustomer.businessName}</p>
                                        <p className="text-gray-600 text-sm">{selectedCustomer.location}</p>
                                        {selectedCustomer.email && <p className="text-gray-500 text-sm">{selectedCustomer.email}</p>}
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="mb-6">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b-2" style={{ borderColor: selectedCustomer.brandGuidelines?.colors?.[0] || '#667eea' }}>
                                                <th className="text-left py-2 text-gray-500 font-bold text-xs uppercase">Description</th>
                                                <th className="text-center py-2 text-gray-500 font-bold text-xs uppercase w-16">Qty</th>
                                                <th className="text-right py-2 text-gray-500 font-bold text-xs uppercase w-24">Price</th>
                                                <th className="text-right py-2 text-gray-500 font-bold text-xs uppercase w-24">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoiceForm.items.filter(item => item.description).map((item, idx) => (
                                                <tr key={item.id} className="border-b border-gray-100">
                                                    <td className="py-3 text-gray-800">{item.description || 'Service item'}</td>
                                                    <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                                                    <td className="py-3 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                                                    <td className="py-3 text-right text-gray-800 font-medium">{formatCurrency(item.quantity * item.unitPrice)}</td>
                                                </tr>
                                            ))}
                                            {invoiceForm.items.every(item => !item.description) && (
                                                <tr>
                                                    <td colSpan={4} className="py-4 text-center text-gray-400 italic">Add items to see preview</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Totals */}
                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="text-gray-800">{formatCurrency(calculateInvoiceTotals().subtotal)}</span>
                                    </div>
                                    {invoiceForm.discount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">
                                                Discount {invoiceForm.discountType === 'percentage' ? `(${invoiceForm.discount}%)` : ''}
                                            </span>
                                            <span className="text-green-600">-{formatCurrency(calculateInvoiceTotals().discountAmount)}</span>
                                        </div>
                                    )}
                                    {invoiceForm.taxRate > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Tax ({invoiceForm.taxRate}%)</span>
                                            <span className="text-gray-800">{formatCurrency(calculateInvoiceTotals().taxAmount)}</span>
                                        </div>
                                    )}
                                    <div
                                        className="flex justify-between text-lg font-bold pt-2 border-t mt-2"
                                        style={{ borderColor: selectedCustomer.brandGuidelines?.colors?.[0] || '#667eea' }}
                                    >
                                        <span style={{ color: selectedCustomer.brandGuidelines?.colors?.[0] || '#667eea' }}>Total Due</span>
                                        <span style={{ color: selectedCustomer.brandGuidelines?.colors?.[0] || '#667eea' }}>
                                            {formatCurrency(calculateInvoiceTotals().total)}
                                        </span>
                                    </div>
                                </div>

                                {/* Notes */}
                                {invoiceForm.notes && (
                                    <div className="mt-6 bg-yellow-50 rounded-lg p-3">
                                        <p className="text-gray-500 text-xs uppercase font-bold mb-1">Notes</p>
                                        <p className="text-gray-700 text-sm">{invoiceForm.notes}</p>
                                    </div>
                                )}

                                {/* Terms */}
                                {invoiceForm.terms && (
                                    <div className="mt-4 border-t pt-4">
                                        <p className="text-gray-400 text-xs uppercase font-bold mb-1">Terms & Conditions</p>
                                        <p className="text-gray-500 text-xs">{invoiceForm.terms}</p>
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="mt-6 pt-4 border-t text-center">
                                    <p className="text-gray-400 text-xs">Thank you for your business!</p>
                                    {selectedCustomer.websiteUrl && (
                                        <p className="text-gray-400 text-xs mt-1">{selectedCustomer.websiteUrl}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Invoice View Modal */}
        {viewingInvoice && selectedCustomer && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b">
                        <h3 className="font-bold text-gray-800">Invoice {viewingInvoice.invoiceNumber}</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEmailInvoice(viewingInvoice)}
                                className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-600 flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Email Invoice
                            </button>
                            <button
                                onClick={() => {
                                    const printWindow = window.open('', '_blank');
                                    if (printWindow) {
                                        const { subject } = generateInvoiceEmail(viewingInvoice, selectedCustomer);
                                        const paymentStatus = getInvoicePaymentStatus(viewingInvoice);
                                        const balance = getInvoiceBalance(viewingInvoice);
                                        const statusColors: Record<string, { bg: string; text: string }> = {
                                            paid: { bg: '#dcfce7', text: '#166534' },
                                            partial: { bg: '#ffedd5', text: '#c2410c' },
                                            unpaid: { bg: '#fee2e2', text: '#dc2626' },
                                            overdue: { bg: '#fee2e2', text: '#dc2626' }
                                        };
                                        const statusStyle = statusColors[paymentStatus.status];
                                        printWindow.document.write(`
                                            <!DOCTYPE html><html><head><title>${subject}</title>
                                            <style>
                                                * { margin: 0; padding: 0; box-sizing: border-box; }
                                                body { font-family: 'Segoe UI', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                                                .header { background: linear-gradient(135deg, ${selectedCustomer.brandGuidelines?.colors?.[0] || '#667eea'}, ${selectedCustomer.brandGuidelines?.colors?.[1] || '#764ba2'}); padding: 24px; border-radius: 12px; margin-bottom: 24px; }
                                                .header h1 { color: white; font-size: 24px; margin-bottom: 4px; }
                                                .header p { color: rgba(255,255,255,0.8); font-size: 14px; }
                                                .invoice-badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 8px; display: inline-block; }
                                                .invoice-badge p { color: white; }
                                                .section { margin-bottom: 24px; }
                                                .section-title { color: #9ca3af; font-size: 11px; text-transform: uppercase; font-weight: bold; margin-bottom: 8px; }
                                                .bill-to { background: #f9fafb; padding: 12px; border-radius: 8px; }
                                                table { width: 100%; border-collapse: collapse; }
                                                th { text-align: left; padding: 8px; color: #6b7280; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid ${selectedCustomer.brandGuidelines?.colors?.[0] || '#667eea'}; }
                                                td { padding: 12px 8px; border-bottom: 1px solid #f3f4f6; }
                                                .totals { border-top: 1px solid #e5e7eb; padding-top: 16px; }
                                                .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                                                .grand-total { font-size: 18px; font-weight: bold; color: ${selectedCustomer.brandGuidelines?.colors?.[0] || '#667eea'}; border-top: 2px solid ${selectedCustomer.brandGuidelines?.colors?.[0] || '#667eea'}; padding-top: 8px; margin-top: 8px; }
                                                .notes { background: #fefce8; padding: 12px; border-radius: 8px; margin-top: 24px; }
                                                .terms { border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 16px; }
                                                .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
                                                .status-badge { display: inline-block; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
                                                .payment-section { background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 16px; }
                                                .progress-bar { width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin: 8px 0; }
                                                .progress-fill { height: 100%; border-radius: 4px; }
                                            </style>
                                            </head><body>
                                            <div class="header">
                                                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                                    <div>
                                                        <h1>${viewingInvoice.sender?.company || viewingInvoice.sender?.name || selectedCustomer.businessName}</h1>
                                                        ${viewingInvoice.sender?.address ? `<p>${viewingInvoice.sender.address}</p>` : ''}
                                                        ${viewingInvoice.sender?.city ? `<p>${viewingInvoice.sender.city}</p>` : ''}
                                                        ${viewingInvoice.sender?.phone ? `<p>${viewingInvoice.sender.phone}</p>` : ''}
                                                        ${viewingInvoice.sender?.email ? `<p>${viewingInvoice.sender.email}</p>` : ''}
                                                    </div>
                                                    <div style="text-align: right;">
                                                        <div class="invoice-badge">
                                                            <p style="font-size: 11px; text-transform: uppercase;">Invoice</p>
                                                            <p style="font-size: 18px; font-weight: bold;">${viewingInvoice.invoiceNumber}</p>
                                                        </div>
                                                        <div class="status-badge" style="background: ${statusStyle.bg}; color: ${statusStyle.text}; margin-top: 8px;">
                                                            ${paymentStatus.label}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="section">
                                                <div style="display: flex; justify-content: space-between;">
                                                    <div><p class="section-title">Invoice Date</p><p>${new Date(viewingInvoice.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p></div>
                                                    ${viewingInvoice.dueDate ? `<div style="text-align: right;"><p class="section-title">Due Date</p><p>${new Date(viewingInvoice.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p></div>` : ''}
                                                </div>
                                            </div>
                                            <div class="section">
                                                <p class="section-title">Bill To</p>
                                                <div class="bill-to">
                                                    <p style="font-weight: bold;">${selectedCustomer.businessName}</p>
                                                    <p>${selectedCustomer.location}</p>
                                                    ${selectedCustomer.email ? `<p>${selectedCustomer.email}</p>` : ''}
                                                </div>
                                            </div>
                                            <div class="section">
                                                <table>
                                                    <thead><tr><th>Description</th><th style="text-align: center;">Qty</th><th style="text-align: right;">Price</th><th style="text-align: right;">Total</th></tr></thead>
                                                    <tbody>${viewingInvoice.items?.map(item => `<tr><td>${item.description}</td><td style="text-align: center;">${item.quantity}</td><td style="text-align: right;">$${item.unitPrice.toFixed(2)}</td><td style="text-align: right;">$${(item.quantity * item.unitPrice).toFixed(2)}</td></tr>`).join('') || ''}</tbody>
                                                </table>
                                            </div>
                                            <div class="totals">
                                                <div class="total-row"><span>Subtotal</span><span>$${viewingInvoice.subtotal.toFixed(2)}</span></div>
                                                ${viewingInvoice.discount > 0 ? `<div class="total-row"><span>Discount</span><span style="color: #16a34a;">-$${(viewingInvoice.discountType === 'percentage' ? viewingInvoice.subtotal * (viewingInvoice.discount / 100) : viewingInvoice.discount).toFixed(2)}</span></div>` : ''}
                                                ${viewingInvoice.taxRate > 0 ? `<div class="total-row"><span>Tax (${viewingInvoice.taxRate}%)</span><span>$${viewingInvoice.taxAmount.toFixed(2)}</span></div>` : ''}
                                                <div class="total-row grand-total"><span>Total</span><span>$${viewingInvoice.total.toFixed(2)}</span></div>
                                            </div>
                                            <div class="payment-section">
                                                <p class="section-title">Payment Status</p>
                                                <div class="progress-bar">
                                                    <div class="progress-fill" style="width: ${Math.min(100, ((viewingInvoice.paidAmount || 0) / viewingInvoice.total) * 100)}%; background: ${paymentStatus.status === 'paid' ? '#22c55e' : paymentStatus.status === 'partial' ? '#f97316' : '#ef4444'};"></div>
                                                </div>
                                                <div style="display: flex; justify-content: space-between; font-size: 14px; margin-top: 8px;">
                                                    <span>Paid: <strong style="color: #22c55e;">$${(viewingInvoice.paidAmount || 0).toFixed(2)}</strong></span>
                                                    ${balance > 0 ? `<span>Balance Due: <strong style="color: #f97316;">$${balance.toFixed(2)}</strong></span>` : ''}
                                                </div>
                                            </div>
                                            ${viewingInvoice.notes ? `<div class="notes"><p class="section-title">Notes</p><p>${viewingInvoice.notes}</p></div>` : ''}
                                            ${viewingInvoice.terms ? `<div class="terms"><p class="section-title">Terms & Conditions</p><p style="font-size: 12px; color: #6b7280;">${viewingInvoice.terms}</p></div>` : ''}
                                            <div class="footer"><p>Thank you for your business!</p></div>
                                            </body></html>
                                        `);
                                        printWindow.document.close();
                                        printWindow.print();
                                    }
                                }}
                                className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-200 flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Print
                            </button>
                            <button
                                onClick={() => setViewingInvoice(null)}
                                className="text-gray-400 hover:text-gray-600 text-xl"
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                        {/* Brand Header with Sender Info */}
                        <div
                            className="rounded-xl p-6 mb-6"
                            style={{
                                background: selectedCustomer.brandGuidelines?.colors?.[0]
                                    ? `linear-gradient(135deg, ${selectedCustomer.brandGuidelines.colors[0]}, ${selectedCustomer.brandGuidelines.colors[1] || selectedCustomer.brandGuidelines.colors[0]})`
                                    : 'linear-gradient(135deg, #667eea, #764ba2)'
                            }}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    {/* Sender/From Details */}
                                    {viewingInvoice.sender ? (
                                        <>
                                            <h1 className="text-xl font-bold text-white">
                                                {viewingInvoice.sender.company || viewingInvoice.sender.name}
                                            </h1>
                                            {viewingInvoice.sender.company && viewingInvoice.sender.name && (
                                                <p className="text-white/80 text-sm">{viewingInvoice.sender.name}</p>
                                            )}
                                            {viewingInvoice.sender.address && <p className="text-white/70 text-xs mt-1">{viewingInvoice.sender.address}</p>}
                                            {viewingInvoice.sender.city && <p className="text-white/70 text-xs">{viewingInvoice.sender.city}</p>}
                                            {viewingInvoice.sender.phone && <p className="text-white/70 text-xs mt-1">{viewingInvoice.sender.phone}</p>}
                                            {viewingInvoice.sender.email && <p className="text-white/70 text-xs">{viewingInvoice.sender.email}</p>}
                                            {viewingInvoice.sender.website && <p className="text-white/70 text-xs">{viewingInvoice.sender.website}</p>}
                                        </>
                                    ) : (
                                        <>
                                            <h1 className="text-xl font-bold text-white">{selectedCustomer.businessName}</h1>
                                            <p className="text-white/80 text-sm">{selectedCustomer.location}</p>
                                        </>
                                    )}
                                </div>
                                <div className="bg-white/20 rounded-lg px-4 py-2 text-right">
                                    <p className="text-white/80 text-xs uppercase font-bold">Invoice</p>
                                    <p className="text-white font-bold">{viewingInvoice.invoiceNumber}</p>
                                </div>
                            </div>
                        </div>

                        {/* Invoice Details */}
                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                            <div>
                                <p className="text-gray-400 text-xs uppercase font-bold">Created</p>
                                <p className="text-gray-800">{formatDate(viewingInvoice.createdAt)}</p>
                            </div>
                            {viewingInvoice.dueDate && (
                                <div>
                                    <p className="text-gray-400 text-xs uppercase font-bold">Due Date</p>
                                    <p className="text-gray-800">{formatDate(viewingInvoice.dueDate)}</p>
                                </div>
                            )}
                        </div>

                        {/* Bill To (Customer) */}
                        <div className="mb-6">
                            <p className="text-gray-400 text-xs uppercase font-bold mb-2">Bill To</p>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-gray-800 font-bold">{selectedCustomer.businessName}</p>
                                <p className="text-gray-600 text-sm">{selectedCustomer.location}</p>
                                {selectedCustomer.email && <p className="text-gray-500 text-sm">{selectedCustomer.email}</p>}
                                {selectedCustomer.phone && <p className="text-gray-500 text-sm">{selectedCustomer.phone}</p>}
                            </div>
                        </div>

                        {/* Items */}
                        {viewingInvoice.items && viewingInvoice.items.length > 0 && (
                            <table className="w-full text-sm mb-6">
                                <thead>
                                    <tr className="border-b-2" style={{ borderColor: selectedCustomer.brandGuidelines?.colors?.[0] || '#667eea' }}>
                                        <th className="text-left py-2 text-gray-500 font-bold text-xs uppercase">Item</th>
                                        <th className="text-center py-2 text-gray-500 font-bold text-xs uppercase">Qty</th>
                                        <th className="text-right py-2 text-gray-500 font-bold text-xs uppercase">Price</th>
                                        <th className="text-right py-2 text-gray-500 font-bold text-xs uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewingInvoice.items.map((item, idx) => (
                                        <tr key={idx} className="border-b border-gray-100">
                                            <td className="py-3">{item.description}</td>
                                            <td className="py-3 text-center">{item.quantity}</td>
                                            <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                                            <td className="py-3 text-right font-medium">{formatCurrency(item.quantity * item.unitPrice)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Totals */}
                        <div className="border-t pt-4 space-y-2">
                            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(viewingInvoice.subtotal)}</span></div>
                            {viewingInvoice.discount > 0 && (
                                <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="text-green-600">-{formatCurrency(viewingInvoice.discountType === 'percentage' ? viewingInvoice.subtotal * (viewingInvoice.discount / 100) : viewingInvoice.discount)}</span></div>
                            )}
                            {viewingInvoice.taxRate > 0 && (
                                <div className="flex justify-between"><span className="text-gray-500">Tax ({viewingInvoice.taxRate}%)</span><span>{formatCurrency(viewingInvoice.taxAmount)}</span></div>
                            )}
                            <div className="flex justify-between text-lg font-bold pt-2 border-t" style={{ color: selectedCustomer.brandGuidelines?.colors?.[0] || '#667eea' }}>
                                <span>Total</span><span>{formatCurrency(viewingInvoice.total)}</span>
                            </div>
                        </div>

                        {/* Payment Status Section */}
                        {(() => {
                            const paymentStatus = getInvoicePaymentStatus(viewingInvoice);
                            const balance = getInvoiceBalance(viewingInvoice);
                            return (
                                <div className="mt-6 bg-gray-50 rounded-xl p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-xs font-bold text-gray-500 uppercase">Payment Status</p>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${paymentStatus.bgColor} ${paymentStatus.color}`}>
                                            {paymentStatus.label}
                                        </span>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                        <div
                                            className={`h-2 rounded-full transition-all ${
                                                paymentStatus.status === 'paid' ? 'bg-green-500' :
                                                paymentStatus.status === 'partial' ? 'bg-orange-500' :
                                                'bg-red-400'
                                            }`}
                                            style={{ width: `${Math.min(100, ((viewingInvoice.paidAmount || 0) / (viewingInvoice.total || 1)) * 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                            Paid: <span className="font-bold text-green-600">{formatCurrency(viewingInvoice.paidAmount || 0)}</span>
                                        </span>
                                        {balance > 0 && (
                                            <span className="text-gray-600">
                                                Balance: <span className="font-bold text-orange-600">{formatCurrency(balance)}</span>
                                            </span>
                                        )}
                                    </div>
                                    {/* Record Payment Button */}
                                    {paymentStatus.status !== 'paid' && (
                                        <button
                                            onClick={() => handleOpenPaymentModal(viewingInvoice)}
                                            className="w-full mt-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold text-sm hover:from-green-600 hover:to-emerald-700 flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Record Payment
                                        </button>
                                    )}
                                </div>
                            );
                        })()}

                        {viewingInvoice.notes && (
                            <div className="mt-6 bg-yellow-50 rounded-lg p-3">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Notes</p>
                                <p className="text-sm text-gray-700">{viewingInvoice.notes}</p>
                            </div>
                        )}

                        {viewingInvoice.terms && (
                            <div className="mt-4 pt-4 border-t">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Terms</p>
                                <p className="text-xs text-gray-500">{viewingInvoice.terms}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Quick Email Modal */}
        {showEmailModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Generate Email</h3>
                    <p className="text-gray-600 mb-4">
                        Generate a new email using {selectedCustomer?.businessName}'s brand guidelines and tone.
                    </p>
                    {selectedCustomer?.brandGuidelines && (
                        <div className="bg-purple-50 p-4 rounded-xl mb-4">
                            <p className="text-sm text-purple-800">
                                <strong>Brand Tone:</strong> {selectedCustomer.brandGuidelines.tone}
                            </p>
                            <div className="flex gap-2 mt-2">
                                {selectedCustomer.brandGuidelines.colors?.map((c, i) => (
                                    <div key={i} className="w-6 h-6 rounded-full border" style={{ backgroundColor: c }}></div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowEmailModal(false)}
                            className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleQuickEmail}
                            disabled={emailLoading}
                            className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-bold disabled:opacity-50"
                        >
                            {emailLoading ? 'Generating...' : 'Generate (2 Cr)'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Record Payment Modal */}
        {showPaymentModal && paymentInvoice && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
                        <h3 className="text-xl font-bold text-white">Record Payment</h3>
                        <p className="text-green-100 text-sm mt-1">Invoice {paymentInvoice.invoiceNumber}</p>
                    </div>

                    <div className="p-6">
                        {/* Invoice Summary */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-500">Invoice Total</span>
                                <span className="font-bold text-gray-800">{formatCurrency(paymentInvoice.total)}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-500">Already Paid</span>
                                <span className="text-green-600">{formatCurrency(paymentInvoice.paidAmount || 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                                <span className="font-bold text-gray-700">Balance Due</span>
                                <span className="font-bold text-orange-600">{formatCurrency(getInvoiceBalance(paymentInvoice))}</span>
                            </div>
                        </div>

                        {/* Payment Form */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Payment Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max={getInvoiceBalance(paymentInvoice)}
                                        step="0.01"
                                        className="w-full pl-8 pr-4 py-3 border rounded-xl text-lg font-bold"
                                        value={paymentForm.amount}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentForm({ ...paymentForm, amount: getInvoiceBalance(paymentInvoice) })}
                                        className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold hover:bg-green-200"
                                    >
                                        Pay Full Balance
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentForm({ ...paymentForm, amount: getInvoiceBalance(paymentInvoice) / 2 })}
                                        className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold hover:bg-orange-200"
                                    >
                                        Pay 50%
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Payment Method</label>
                                <select
                                    className="w-full px-4 py-3 border rounded-xl bg-white"
                                    value={paymentForm.method}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value as PaymentRecord['method'] })}
                                >
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="card">Credit/Debit Card</option>
                                    <option value="cash">Cash</option>
                                    <option value="check">Check</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Reference/Transaction ID (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g., TXN123456789"
                                    className="w-full px-4 py-3 border rounded-xl"
                                    value={paymentForm.reference}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Notes (Optional)</label>
                                <textarea
                                    placeholder="Any additional notes..."
                                    className="w-full px-4 py-3 border rounded-xl resize-none h-20"
                                    value={paymentForm.notes}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Payment Preview */}
                        {paymentForm.amount > 0 && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-sm text-blue-800">
                                    After this payment:
                                    <span className="font-bold ml-1">
                                        {paymentForm.amount >= getInvoiceBalance(paymentInvoice)
                                            ? 'Invoice will be marked as PAID'
                                            : `${formatCurrency(getInvoiceBalance(paymentInvoice) - paymentForm.amount)} will remain due`
                                        }
                                    </span>
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setPaymentInvoice(null);
                                }}
                                className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRecordPayment}
                                disabled={paymentForm.amount <= 0}
                                className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Record Payment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
