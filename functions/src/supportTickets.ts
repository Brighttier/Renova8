/**
 * Support Tickets Cloud Functions
 *
 * Handles creation, retrieval, and management of support tickets.
 * Uses Jira Cloud as the backend storage instead of Firestore.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import {
  createJiraIssue,
  getJiraIssue,
  getUserJiraIssues,
  addJiraComment,
  transitionJiraIssue,
  isJiraConfigured,
  type JiraIssue,
} from './lib/jiraService';

// Types for API responses (matching frontend expectations)
interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'support';
  message: string;
  createdAt: string;
}

interface SupportTicketResponse {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  messages: TicketMessage[];
  jiraKey: string; // Jira issue key (e.g., "SUPPORT-123")
}

/**
 * Convert Jira issue to ticket response format
 */
function jiraToTicketResponse(jira: JiraIssue, userId: string): SupportTicketResponse {
  // Convert Jira comments to messages
  const messages: TicketMessage[] = jira.comments.map((comment, index) => ({
    id: comment.id || `msg_${index}`,
    senderId: comment.authorEmail === jira.userEmail ? userId : 'support',
    senderName: comment.authorName,
    senderType: comment.authorEmail === jira.userEmail ? 'user' : 'support',
    message: comment.body,
    createdAt: comment.createdAt,
  }));

  // Add initial description as first message if no comments
  if (messages.length === 0) {
    messages.push({
      id: 'msg_initial',
      senderId: userId,
      senderName: jira.userName,
      senderType: 'user',
      message: jira.description,
      createdAt: jira.createdAt,
    });
  }

  return {
    id: jira.key, // Use Jira key as ID
    userId: jira.userId || userId,
    userEmail: jira.userEmail,
    userName: jira.userName,
    subject: jira.subject,
    category: jira.category,
    description: jira.description,
    status: jira.status,
    priority: jira.priority,
    createdAt: jira.createdAt,
    updatedAt: jira.updatedAt,
    resolvedAt: jira.status === 'resolved' || jira.status === 'closed' ? jira.updatedAt : undefined,
    messages,
    jiraKey: jira.key,
  };
}

/**
 * Create a new support ticket (creates issue in Jira)
 */
export const createTicket = onCall({
  secrets: ['JIRA_API_URL', 'JIRA_API_EMAIL', 'JIRA_API_TOKEN', 'JIRA_PROJECT_KEY'],
}, async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in to create a ticket.');
  }

  // Check Jira configuration
  if (!isJiraConfigured()) {
    throw new HttpsError('failed-precondition', 'Support ticket system is not configured. Please contact administrator.');
  }

  const { subject, category, description, priority } = request.data;

  // Validate required fields
  if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'Subject is required.');
  }
  if (!category || !['technical', 'billing', 'feature', 'account', 'other'].includes(category)) {
    throw new HttpsError('invalid-argument', 'Invalid category.');
  }
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'Description is required.');
  }

  const userId = request.auth.uid;
  const userEmail = request.auth.token.email || 'unknown@example.com';
  const userName = request.auth.token.name || userEmail.split('@')[0];

  try {
    const jiraIssue = await createJiraIssue({
      subject: subject.trim(),
      description: description.trim(),
      category,
      priority: priority || 'medium',
      userEmail,
      userName,
      userId,
    });

    console.log(`Support ticket created in Jira: ${jiraIssue.key} by user ${userId}`);

    const ticket = jiraToTicketResponse(jiraIssue, userId);

    return {
      success: true,
      ticketId: jiraIssue.key,
      ticket,
    };
  } catch (error) {
    console.error('Error creating Jira ticket:', error);
    throw new HttpsError('internal', `Failed to create support ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Get all tickets for the current user (from Jira)
 */
export const getUserTickets = onCall({
  secrets: ['JIRA_API_URL', 'JIRA_API_EMAIL', 'JIRA_API_TOKEN', 'JIRA_PROJECT_KEY'],
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in to view tickets.');
  }

  if (!isJiraConfigured()) {
    throw new HttpsError('failed-precondition', 'Support ticket system is not configured.');
  }

  const userId = request.auth.uid;
  const userEmail = request.auth.token.email;
  const { status } = request.data || {};

  if (!userEmail) {
    throw new HttpsError('failed-precondition', 'User email is required to fetch tickets.');
  }

  try {
    const jiraIssues = await getUserJiraIssues(userEmail);

    // Convert to ticket format
    let tickets = jiraIssues.map(issue => jiraToTicketResponse(issue, userId));

    // Filter by status if provided
    if (status && ['open', 'in-progress', 'waiting', 'resolved', 'closed'].includes(status)) {
      tickets = tickets.filter(t => t.status === status);
    }

    return {
      success: true,
      tickets,
      count: tickets.length,
    };
  } catch (error) {
    console.error('Error fetching Jira tickets:', error);
    throw new HttpsError('internal', `Failed to fetch tickets: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Get a single ticket by Jira key (only if owned by user)
 */
export const getTicketDetail = onCall({
  secrets: ['JIRA_API_URL', 'JIRA_API_EMAIL', 'JIRA_API_TOKEN', 'JIRA_PROJECT_KEY'],
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in to view ticket details.');
  }

  if (!isJiraConfigured()) {
    throw new HttpsError('failed-precondition', 'Support ticket system is not configured.');
  }

  const { ticketId } = request.data;
  const userEmail = request.auth.token.email;
  const userId = request.auth.uid;

  if (!ticketId || typeof ticketId !== 'string') {
    throw new HttpsError('invalid-argument', 'Ticket ID (Jira key) is required.');
  }

  try {
    const jiraIssue = await getJiraIssue(ticketId);

    // Verify ownership by checking email in issue
    if (jiraIssue.userEmail !== userEmail) {
      throw new HttpsError('permission-denied', 'You do not have permission to view this ticket.');
    }

    const ticket = jiraToTicketResponse(jiraIssue, userId);

    return {
      success: true,
      ticket,
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    console.error('Error fetching Jira ticket:', error);
    throw new HttpsError('internal', `Failed to fetch ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Add a message/reply to an existing ticket (adds comment in Jira)
 */
export const addTicketMessage = onCall({
  secrets: ['JIRA_API_URL', 'JIRA_API_EMAIL', 'JIRA_API_TOKEN', 'JIRA_PROJECT_KEY'],
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in to reply to a ticket.');
  }

  if (!isJiraConfigured()) {
    throw new HttpsError('failed-precondition', 'Support ticket system is not configured.');
  }

  const { ticketId, message } = request.data;
  const userEmail = request.auth.token.email;
  const userName = request.auth.token.name || userEmail?.split('@')[0] || 'User';
  const userId = request.auth.uid;

  if (!ticketId || typeof ticketId !== 'string') {
    throw new HttpsError('invalid-argument', 'Ticket ID (Jira key) is required.');
  }
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'Message is required.');
  }

  try {
    // Get ticket to verify ownership
    const jiraIssue = await getJiraIssue(ticketId);

    if (jiraIssue.userEmail !== userEmail) {
      throw new HttpsError('permission-denied', 'You do not have permission to reply to this ticket.');
    }

    if (jiraIssue.status === 'closed') {
      throw new HttpsError('failed-precondition', 'Cannot reply to a closed ticket. Please reopen it first.');
    }

    // Add comment to Jira
    const comment = await addJiraComment(ticketId, message.trim(), userName);

    console.log(`Comment added to Jira ticket ${ticketId} by user ${userId}`);

    return {
      success: true,
      message: {
        id: comment.id,
        senderId: userId,
        senderName: userName,
        senderType: 'user' as const,
        message: comment.body,
        createdAt: comment.createdAt,
      },
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    console.error('Error adding Jira comment:', error);
    throw new HttpsError('internal', `Failed to add message: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Close a ticket (transitions Jira issue to Done/Closed)
 */
export const closeTicket = onCall({
  secrets: ['JIRA_API_URL', 'JIRA_API_EMAIL', 'JIRA_API_TOKEN', 'JIRA_PROJECT_KEY'],
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in to close a ticket.');
  }

  if (!isJiraConfigured()) {
    throw new HttpsError('failed-precondition', 'Support ticket system is not configured.');
  }

  const { ticketId, reason } = request.data;
  const userEmail = request.auth.token.email;
  const userName = request.auth.token.name || 'User';
  const userId = request.auth.uid;

  if (!ticketId || typeof ticketId !== 'string') {
    throw new HttpsError('invalid-argument', 'Ticket ID (Jira key) is required.');
  }

  try {
    // Get ticket to verify ownership
    const jiraIssue = await getJiraIssue(ticketId);

    if (jiraIssue.userEmail !== userEmail) {
      throw new HttpsError('permission-denied', 'You do not have permission to close this ticket.');
    }

    // Add closing comment if reason provided
    if (reason && typeof reason === 'string' && reason.trim().length > 0) {
      await addJiraComment(ticketId, `Ticket closed by user: ${reason.trim()}`, userName);
    }

    // Transition to closed
    await transitionJiraIssue(ticketId, 'closed');

    console.log(`Jira ticket ${ticketId} closed by user ${userId}`);

    return {
      success: true,
      ticketId,
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    console.error('Error closing Jira ticket:', error);
    throw new HttpsError('internal', `Failed to close ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Reopen a closed ticket (transitions Jira issue back to Open)
 */
export const reopenTicket = onCall({
  secrets: ['JIRA_API_URL', 'JIRA_API_EMAIL', 'JIRA_API_TOKEN', 'JIRA_PROJECT_KEY'],
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in to reopen a ticket.');
  }

  if (!isJiraConfigured()) {
    throw new HttpsError('failed-precondition', 'Support ticket system is not configured.');
  }

  const { ticketId, message } = request.data;
  const userEmail = request.auth.token.email;
  const userName = request.auth.token.name || 'User';
  const userId = request.auth.uid;

  if (!ticketId || typeof ticketId !== 'string') {
    throw new HttpsError('invalid-argument', 'Ticket ID (Jira key) is required.');
  }

  try {
    // Get ticket to verify ownership
    const jiraIssue = await getJiraIssue(ticketId);

    if (jiraIssue.userEmail !== userEmail) {
      throw new HttpsError('permission-denied', 'You do not have permission to reopen this ticket.');
    }

    if (jiraIssue.status !== 'closed' && jiraIssue.status !== 'resolved') {
      throw new HttpsError('failed-precondition', 'Only closed or resolved tickets can be reopened.');
    }

    // Add reopen comment
    const reopenMessage = message?.trim() || 'Ticket reopened by user.';
    await addJiraComment(ticketId, reopenMessage, userName);

    // Transition back to open
    await transitionJiraIssue(ticketId, 'open');

    console.log(`Jira ticket ${ticketId} reopened by user ${userId}`);

    return {
      success: true,
      ticketId,
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    console.error('Error reopening Jira ticket:', error);
    throw new HttpsError('internal', `Failed to reopen ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});
