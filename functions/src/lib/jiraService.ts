/**
 * Jira Cloud Service
 *
 * Provides functions to interact with Jira Cloud REST API v3.
 * Used for creating and managing support tickets in Jira.
 */

// Jira configuration from environment variables
const getJiraConfig = () => ({
  baseUrl: process.env.JIRA_API_URL || '',
  email: process.env.JIRA_API_EMAIL || '',
  apiToken: process.env.JIRA_API_TOKEN || '',
  projectKey: process.env.JIRA_PROJECT_KEY || 'SUPPORT',
});

// Priority mapping from app to Jira
const PRIORITY_MAP: Record<string, string> = {
  'low': 'Low',
  'medium': 'Medium',
  'high': 'High',
  'urgent': 'Highest',
};

// Reverse priority mapping from Jira to app
const REVERSE_PRIORITY_MAP: Record<string, string> = {
  'Lowest': 'low',
  'Low': 'low',
  'Medium': 'medium',
  'High': 'high',
  'Highest': 'urgent',
};

// Status mapping from Jira to app
const STATUS_MAP: Record<string, string> = {
  'To Do': 'open',
  'Open': 'open',
  'In Progress': 'in-progress',
  'In Review': 'in-progress',
  'Waiting': 'waiting',
  'Done': 'resolved',
  'Closed': 'closed',
  'Resolved': 'resolved',
};

// Interfaces
export interface JiraIssueInput {
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'feature' | 'account' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  userEmail: string;
  userName: string;
  userId: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  userEmail: string;
  userName: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  comments: JiraComment[];
}

export interface JiraComment {
  id: string;
  body: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
}

/**
 * Get authorization header for Jira API
 */
function getAuthHeader(): string {
  const config = getJiraConfig();
  const credentials = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Make a request to Jira API
 */
async function jiraRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  const config = getJiraConfig();

  if (!config.baseUrl || !config.email || !config.apiToken) {
    throw new Error('Jira configuration is missing. Please set JIRA_API_URL, JIRA_API_EMAIL, and JIRA_API_TOKEN.');
  }

  const url = `${config.baseUrl}/rest/api/3${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Jira API error: ${response.status} ${errorText}`);
    throw new Error(`Jira API error: ${response.status} - ${errorText}`);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Create a new issue in Jira
 */
export async function createJiraIssue(input: JiraIssueInput): Promise<JiraIssue> {
  const config = getJiraConfig();

  // Build description with user info
  const fullDescription = {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: input.description },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '---', marks: [{ type: 'strong' }] },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Submitted by: ', marks: [{ type: 'strong' }] },
          { type: 'text', text: `${input.userName} (${input.userEmail})` },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Category: ', marks: [{ type: 'strong' }] },
          { type: 'text', text: input.category },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'User ID: ', marks: [{ type: 'strong' }] },
          { type: 'text', text: input.userId },
        ],
      },
    ],
  };

  const issueData = {
    fields: {
      project: {
        key: config.projectKey,
      },
      summary: input.subject,
      description: fullDescription,
      issuetype: {
        name: 'Task', // or 'Bug', 'Story' depending on your Jira setup
      },
      priority: {
        name: PRIORITY_MAP[input.priority] || 'Medium',
      },
      labels: [input.category, 'support-ticket'],
    },
  };

  interface CreateIssueResponse {
    id: string;
    key: string;
    self: string;
  }

  const result = await jiraRequest<CreateIssueResponse>('/issue', 'POST', issueData);

  // Fetch the created issue to get full details
  return getJiraIssue(result.key);
}

/**
 * Get a single Jira issue by key
 */
export async function getJiraIssue(issueKey: string): Promise<JiraIssue> {
  interface JiraIssueResponse {
    id: string;
    key: string;
    fields: {
      summary: string;
      description?: {
        content?: Array<{
          content?: Array<{
            text?: string;
          }>;
        }>;
      };
      priority?: {
        name: string;
      };
      status?: {
        name: string;
      };
      labels?: string[];
      created: string;
      updated: string;
      comment?: {
        comments: Array<{
          id: string;
          body?: {
            content?: Array<{
              content?: Array<{
                text?: string;
              }>;
            }>;
          };
          author?: {
            displayName: string;
            emailAddress?: string;
          };
          created: string;
        }>;
      };
    };
  }

  const issue = await jiraRequest<JiraIssueResponse>(
    `/issue/${issueKey}?expand=renderedFields,names,schema,transitions,editmeta,changelog,comment`
  );

  // Extract description text from ADF format
  const descriptionText = issue.fields.description?.content
    ?.map(block => block.content?.map(c => c.text || '').join('') || '')
    .join('\n') || '';

  // Parse user info from description
  const userEmailMatch = descriptionText.match(/\(([^)]+@[^)]+)\)/);
  const userNameMatch = descriptionText.match(/Submitted by: ([^(]+)/);
  const userIdMatch = descriptionText.match(/User ID: (\S+)/);

  // Extract category from labels
  const category = issue.fields.labels?.find(l =>
    ['technical', 'billing', 'feature', 'account', 'other'].includes(l)
  ) || 'other';

  // Map comments
  const comments: JiraComment[] = (issue.fields.comment?.comments || []).map(c => ({
    id: c.id,
    body: c.body?.content
      ?.map(block => block.content?.map(item => item.text || '').join('') || '')
      .join('\n') || '',
    authorName: c.author?.displayName || 'Unknown',
    authorEmail: c.author?.emailAddress || '',
    createdAt: c.created,
  }));

  return {
    id: issue.id,
    key: issue.key,
    subject: issue.fields.summary,
    description: descriptionText.split('---')[0]?.trim() || descriptionText,
    category,
    priority: REVERSE_PRIORITY_MAP[issue.fields.priority?.name || 'Medium'] || 'medium',
    status: STATUS_MAP[issue.fields.status?.name || 'Open'] || 'open',
    userEmail: userEmailMatch?.[1] || '',
    userName: userNameMatch?.[1]?.trim() || '',
    userId: userIdMatch?.[1] || '',
    createdAt: issue.fields.created,
    updatedAt: issue.fields.updated,
    comments,
  };
}

/**
 * Get all Jira issues for a user by email
 */
export async function getUserJiraIssues(userEmail: string): Promise<JiraIssue[]> {
  const config = getJiraConfig();

  // Use JQL to search for issues containing user's email in description
  const jql = `project = "${config.projectKey}" AND labels = "support-ticket" AND text ~ "${userEmail}" ORDER BY created DESC`;

  interface SearchResponse {
    issues: Array<{
      id: string;
      key: string;
      fields: {
        summary: string;
        description?: {
          content?: Array<{
            content?: Array<{
              text?: string;
            }>;
          }>;
        };
        priority?: {
          name: string;
        };
        status?: {
          name: string;
        };
        labels?: string[];
        created: string;
        updated: string;
      };
    }>;
  }

  const result = await jiraRequest<SearchResponse>(
    `/search?jql=${encodeURIComponent(jql)}&maxResults=50&fields=summary,description,priority,status,labels,created,updated`
  );

  return result.issues.map(issue => {
    const descriptionText = issue.fields.description?.content
      ?.map(block => block.content?.map(c => c.text || '').join('') || '')
      .join('\n') || '';

    const userNameMatch = descriptionText.match(/Submitted by: ([^(]+)/);
    const userIdMatch = descriptionText.match(/User ID: (\S+)/);

    const category = issue.fields.labels?.find(l =>
      ['technical', 'billing', 'feature', 'account', 'other'].includes(l)
    ) || 'other';

    return {
      id: issue.id,
      key: issue.key,
      subject: issue.fields.summary,
      description: descriptionText.split('---')[0]?.trim() || descriptionText,
      category,
      priority: REVERSE_PRIORITY_MAP[issue.fields.priority?.name || 'Medium'] || 'medium',
      status: STATUS_MAP[issue.fields.status?.name || 'Open'] || 'open',
      userEmail,
      userName: userNameMatch?.[1]?.trim() || '',
      userId: userIdMatch?.[1] || '',
      createdAt: issue.fields.created,
      updatedAt: issue.fields.updated,
      comments: [], // Comments not included in search results, fetch separately if needed
    };
  });
}

/**
 * Add a comment to a Jira issue
 */
export async function addJiraComment(
  issueKey: string,
  comment: string,
  authorName: string
): Promise<JiraComment> {
  const commentBody = {
    body: {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: `${authorName}: `, marks: [{ type: 'strong' }] },
            { type: 'text', text: comment },
          ],
        },
      ],
    },
  };

  interface CommentResponse {
    id: string;
    body: {
      content?: Array<{
        content?: Array<{
          text?: string;
        }>;
      }>;
    };
    author: {
      displayName: string;
      emailAddress?: string;
    };
    created: string;
  }

  const result = await jiraRequest<CommentResponse>(
    `/issue/${issueKey}/comment`,
    'POST',
    commentBody
  );

  return {
    id: result.id,
    body: comment,
    authorName: authorName,
    authorEmail: result.author?.emailAddress || '',
    createdAt: result.created,
  };
}

/**
 * Get available transitions for an issue
 */
async function getTransitions(issueKey: string): Promise<Array<{ id: string; name: string }>> {
  interface TransitionsResponse {
    transitions: Array<{
      id: string;
      name: string;
    }>;
  }

  const result = await jiraRequest<TransitionsResponse>(`/issue/${issueKey}/transitions`);
  return result.transitions;
}

/**
 * Transition a Jira issue to a new status
 */
export async function transitionJiraIssue(
  issueKey: string,
  targetStatus: 'open' | 'in-progress' | 'resolved' | 'closed'
): Promise<void> {
  // Get available transitions
  const transitions = await getTransitions(issueKey);

  // Map our status to Jira transition names
  const statusToTransition: Record<string, string[]> = {
    'open': ['Reopen', 'To Do', 'Open'],
    'in-progress': ['In Progress', 'Start Progress'],
    'resolved': ['Resolve', 'Done', 'Resolved'],
    'closed': ['Close', 'Closed', 'Done'],
  };

  const targetNames = statusToTransition[targetStatus] || [];

  // Find matching transition
  const transition = transitions.find(t =>
    targetNames.some(name => t.name.toLowerCase().includes(name.toLowerCase()))
  );

  if (!transition) {
    console.warn(`No transition found for status "${targetStatus}". Available: ${transitions.map(t => t.name).join(', ')}`);
    throw new Error(`Cannot transition to "${targetStatus}". Please check Jira workflow configuration.`);
  }

  // Execute transition
  await jiraRequest(`/issue/${issueKey}/transitions`, 'POST', {
    transition: { id: transition.id },
  });
}

/**
 * Check if Jira is properly configured
 */
export function isJiraConfigured(): boolean {
  const config = getJiraConfig();
  return Boolean(config.baseUrl && config.email && config.apiToken && config.projectKey);
}

/**
 * Test Jira connection
 */
export async function testJiraConnection(): Promise<{ success: boolean; message: string }> {
  try {
    if (!isJiraConfigured()) {
      return { success: false, message: 'Jira is not configured. Missing environment variables.' };
    }

    // Try to get project info
    const config = getJiraConfig();
    await jiraRequest(`/project/${config.projectKey}`);

    return { success: true, message: 'Jira connection successful.' };
  } catch (error) {
    return {
      success: false,
      message: `Jira connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
