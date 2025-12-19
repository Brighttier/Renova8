/**
 * Voice Chat Service with Gemini Live API
 *
 * Provides real-time voice conversation capabilities using Google's Gemini Live API.
 * Enables voice-first interactions with intent classification and automatic transcription.
 */

import { GoogleGenAI, Modality, LiveServerMessage, LiveClientMessage } from '@google/genai';
import { SupportContext, SupportIntent } from './supportChatService';

// ============================================
// Types
// ============================================

export interface VoiceSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  status: 'connecting' | 'active' | 'paused' | 'ended' | 'error';
  transcripts: TranscriptEntry[];
  audioRecordings: AudioRecording[];
  detectedIntents: SupportIntent[];
  context: SupportContext;
}

export interface TranscriptEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  confidence?: number;
  isFinal: boolean;
}

export interface AudioRecording {
  id: string;
  role: 'user' | 'assistant';
  blob?: Blob;
  url?: string;
  duration: number;
  timestamp: number;
}

export interface VoiceSessionConfig {
  enableAudioRecording?: boolean;
  enableTranscription?: boolean;
  voiceId?: string;
  language?: string;
}

// ============================================
// Voice Session Manager
// ============================================

export class VoiceChatSession {
  private session: VoiceSession;
  private genAI: GoogleGenAI | null = null;
  private liveSession: any = null;
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private config: VoiceSessionConfig;

  // Callbacks
  public onStatusChange?: (status: VoiceSession['status']) => void;
  public onTranscript?: (entry: TranscriptEntry) => void;
  public onAudioResponse?: (audioData: ArrayBuffer) => void;
  public onIntentDetected?: (intent: SupportIntent) => void;
  public onError?: (error: Error) => void;

  constructor(context: SupportContext, config: VoiceSessionConfig = {}) {
    this.config = {
      enableAudioRecording: true,
      enableTranscription: true,
      language: 'en-US',
      ...config
    };

    this.session = {
      id: `voice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startedAt: Date.now(),
      status: 'connecting',
      transcripts: [],
      audioRecordings: [],
      detectedIntents: [],
      context
    };
  }

  /**
   * Initialize and start the voice session
   */
  async start(): Promise<boolean> {
    try {
      // Get API key
      const apiKey = import.meta.env.VITE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key');

      if (!apiKey) {
        throw new Error('Gemini API key not found. Please configure your API key.');
      }

      this.genAI = new GoogleGenAI({ apiKey });

      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      });

      // Initialize AudioContext
      this.audioContext = new AudioContext({ sampleRate: 16000 });

      // Set up media recorder for audio recording
      if (this.config.enableAudioRecording && this.mediaStream) {
        this.setupMediaRecorder();
      }

      // Create Gemini Live session
      await this.initializeLiveSession();

      this.updateStatus('active');
      return true;

    } catch (error) {
      console.error('Failed to start voice session:', error);
      this.updateStatus('error');
      this.onError?.(error instanceof Error ? error : new Error('Failed to start voice session'));
      return false;
    }
  }

  /**
   * Initialize Gemini Live session with bidirectional audio
   */
  private async initializeLiveSession(): Promise<void> {
    if (!this.genAI) throw new Error('GenAI not initialized');

    const systemInstruction = this.buildSystemInstruction();

    try {
      // Create live session with Gemini
      this.liveSession = await this.genAI.live.connect({
        model: 'gemini-2.0-flash-live-001',
        config: {
          responseModalities: [Modality.AUDIO, Modality.TEXT],
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: this.config.voiceId || 'Aoede'
              }
            }
          }
        },
        callbacks: {
          onopen: () => {
            console.log('Gemini Live session opened');
            this.updateStatus('active');
          },
          onmessage: (message: LiveServerMessage) => {
            this.handleServerMessage(message);
          },
          onerror: (error: ErrorEvent) => {
            console.error('Gemini Live error:', error);
            this.onError?.(new Error(error.message || 'Live session error'));
          },
          onclose: (event: CloseEvent) => {
            console.log('Gemini Live session closed:', event.reason);
            if (this.session.status === 'active') {
              this.updateStatus('ended');
            }
          }
        }
      });

      // Start streaming audio from microphone
      this.startAudioStreaming();

    } catch (error) {
      console.error('Failed to initialize live session:', error);
      throw error;
    }
  }

  /**
   * Build system instruction for the AI assistant
   */
  private buildSystemInstruction(): string {
    const contextInfo = this.session.context;

    return `You are a friendly and helpful AI support assistant for RenovateMySite, an AI-powered platform for entrepreneurs.

Your role in this voice conversation:
1. Listen carefully to the user's questions and issues
2. Provide clear, spoken responses (keep them concise for voice)
3. Classify their intent (technical support, billing, how-to, etc.)
4. Guide them through troubleshooting steps
5. Offer to escalate to human support when needed

Current context:
- User is on the ${contextInfo.currentPage || 'main'} page
- User plan: ${contextInfo.userPlan || 'free'}
${contextInfo.currentWebsiteName ? `- Working on website: ${contextInfo.currentWebsiteName}` : ''}
${contextInfo.systemStatus?.lastPublishError ? `- Recent error: ${contextInfo.systemStatus.lastPublishError}` : ''}

Speaking guidelines:
- Speak naturally and conversationally
- Keep responses brief (2-3 sentences for simple questions)
- Use encouraging and supportive tone
- Avoid technical jargon unless necessary
- If you can't help, offer to create a support ticket

You can help with:
- Website building and publishing issues
- Custom domain and DNS setup
- SSL certificates
- Finding leads and customers
- Credits and billing questions
- Account settings`;
  }

  /**
   * Start streaming audio from microphone to Gemini
   */
  private startAudioStreaming(): void {
    if (!this.mediaStream || !this.audioContext || !this.liveSession) return;

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (event) => {
      if (this.session.status !== 'active') return;

      const inputData = event.inputBuffer.getChannelData(0);
      const pcm16 = this.convertToPCM16(inputData);
      const base64Audio = this.arrayBufferToBase64(pcm16.buffer as ArrayBuffer);

      // Send audio to Gemini Live
      this.sendAudioChunk(base64Audio);
    };

    source.connect(processor);
    processor.connect(this.audioContext.destination);

    this.isRecording = true;
  }

  /**
   * Send audio chunk to Gemini Live session
   */
  private sendAudioChunk(base64Audio: string): void {
    if (!this.liveSession) return;

    const message: LiveClientMessage = {
      realtimeInput: {
        mediaChunks: [{
          mimeType: 'audio/pcm;rate=16000',
          data: base64Audio
        }]
      }
    };

    try {
      this.liveSession.send(message);
    } catch (error) {
      console.error('Failed to send audio chunk:', error);
    }
  }

  /**
   * Handle messages from Gemini Live server
   */
  private handleServerMessage(message: LiveServerMessage): void {
    // Handle text transcription
    if (message.serverContent?.modelTurn?.parts) {
      for (const part of message.serverContent.modelTurn.parts) {
        // Handle text response
        if (part.text) {
          const transcript: TranscriptEntry = {
            id: `transcript-${Date.now()}`,
            role: 'assistant',
            text: part.text,
            timestamp: Date.now(),
            isFinal: true
          };

          this.session.transcripts.push(transcript);
          this.onTranscript?.(transcript);

          // Detect intent from response
          this.detectIntent(part.text);
        }

        // Handle audio response
        if (part.inlineData?.mimeType?.startsWith('audio/')) {
          const audioData = this.base64ToArrayBuffer(part.inlineData.data || '');
          this.onAudioResponse?.(audioData);
          this.playAudio(audioData);
        }
      }
    }

    // Handle user transcription (if available)
    if (message.serverContent?.inputTranscription) {
      const transcriptionText = typeof message.serverContent.inputTranscription === 'string'
        ? message.serverContent.inputTranscription
        : (message.serverContent.inputTranscription as any)?.text || '';

      if (transcriptionText) {
        const userTranscript: TranscriptEntry = {
          id: `user-transcript-${Date.now()}`,
          role: 'user',
          text: transcriptionText,
          timestamp: Date.now(),
          isFinal: true
        };

        this.session.transcripts.push(userTranscript);
        this.onTranscript?.(userTranscript);
      }
    }
  }

  /**
   * Detect intent from text
   */
  private detectIntent(text: string): void {
    const lowerText = text.toLowerCase();
    let intent: SupportIntent = 'general_question';

    if (/(publish|deploy|hosting|upload)/i.test(lowerText)) {
      intent = 'publishing_issue';
    } else if (/(dns|domain|cname)/i.test(lowerText)) {
      intent = 'dns_domain_issue';
    } else if (/(ssl|https|certificate)/i.test(lowerText)) {
      intent = 'ssl_issue';
    } else if (/(bill|payment|credit|price)/i.test(lowerText)) {
      intent = 'billing_question';
    } else if (/(how|what|where|can i)/i.test(lowerText)) {
      intent = 'how_to';
    } else if (/(bug|broken|error|crash)/i.test(lowerText)) {
      intent = 'bug_report';
    }

    if (!this.session.detectedIntents.includes(intent)) {
      this.session.detectedIntents.push(intent);
      this.onIntentDetected?.(intent);
    }
  }

  /**
   * Play audio response through speakers
   */
  private async playAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) return;

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(audioData.slice(0));
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }

  /**
   * Set up media recorder for saving audio
   */
  private setupMediaRecorder(): void {
    if (!this.mediaStream) return;

    this.mediaRecorder = new MediaRecorder(this.mediaStream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(1000); // Collect data every second
  }

  /**
   * Send a text message during voice chat
   */
  async sendTextMessage(text: string): Promise<void> {
    if (!this.liveSession || this.session.status !== 'active') return;

    const userTranscript: TranscriptEntry = {
      id: `user-text-${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
      isFinal: true
    };

    this.session.transcripts.push(userTranscript);
    this.onTranscript?.(userTranscript);

    const message: LiveClientMessage = {
      clientContent: {
        turns: [{
          role: 'user',
          parts: [{ text }]
        }],
        turnComplete: true
      }
    };

    this.liveSession.send(message);
  }

  /**
   * Pause the voice session (mute mic)
   */
  pause(): void {
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
    }
    this.updateStatus('paused');
  }

  /**
   * Resume the voice session (unmute mic)
   */
  resume(): void {
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = true;
      });
    }
    this.updateStatus('active');
  }

  /**
   * End the voice session
   */
  async end(): Promise<VoiceSession> {
    this.session.endedAt = Date.now();
    this.updateStatus('ended');

    // Stop media recorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
    }

    // Close Gemini Live session
    if (this.liveSession) {
      try {
        this.liveSession.close();
      } catch (e) {
        console.error('Error closing live session:', e);
      }
    }

    // Create final audio recording if chunks exist
    if (this.audioChunks.length > 0) {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);

      this.session.audioRecordings.push({
        id: `recording-${Date.now()}`,
        role: 'user',
        blob: audioBlob,
        url: audioUrl,
        duration: (this.session.endedAt - this.session.startedAt) / 1000,
        timestamp: this.session.startedAt
      });
    }

    return this.session;
  }

  /**
   * Get current session data
   */
  getSession(): VoiceSession {
    return { ...this.session };
  }

  /**
   * Update session status
   */
  private updateStatus(status: VoiceSession['status']): void {
    this.session.status = status;
    this.onStatusChange?.(status);
  }

  // ============================================
  // Utility functions
  // ============================================

  private convertToPCM16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// ============================================
// Conversation Forwarding to Admin
// ============================================

export interface ForwardedConversation {
  id: string;
  sessionId: string;
  userId?: string;
  userEmail?: string;
  transcripts: TranscriptEntry[];
  audioRecordingUrl?: string;
  detectedIntents: SupportIntent[];
  context: SupportContext;
  summary: string;
  forwardedAt: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

/**
 * Forward voice conversation to platform administrators
 */
export async function forwardConversationToAdmin(
  session: VoiceSession,
  priority: ForwardedConversation['priority'] = 'normal',
  additionalNotes?: string
): Promise<ForwardedConversation> {
  // Generate summary from transcripts
  const summary = generateConversationSummary(session.transcripts);

  const forwarded: ForwardedConversation = {
    id: `fwd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sessionId: session.id,
    userId: session.context.userId,
    userEmail: session.context.userEmail,
    transcripts: session.transcripts,
    audioRecordingUrl: session.audioRecordings[0]?.url,
    detectedIntents: session.detectedIntents,
    context: session.context,
    summary: additionalNotes ? `${summary}\n\nAdditional Notes: ${additionalNotes}` : summary,
    forwardedAt: Date.now(),
    priority
  };

  // Store in localStorage for demo (in production, send to backend)
  const existingForwarded = JSON.parse(localStorage.getItem('forwarded_conversations') || '[]');
  existingForwarded.push(forwarded);
  localStorage.setItem('forwarded_conversations', JSON.stringify(existingForwarded));

  console.log('Conversation forwarded to admin:', forwarded);

  return forwarded;
}

/**
 * Generate a summary of the conversation
 */
function generateConversationSummary(transcripts: TranscriptEntry[]): string {
  if (transcripts.length === 0) return 'No conversation recorded.';

  const userMessages = transcripts.filter(t => t.role === 'user').map(t => t.text);
  const firstUserMessage = userMessages[0] || 'No user message';
  const lastUserMessage = userMessages[userMessages.length - 1] || '';

  let summary = `User inquiry: "${firstUserMessage.slice(0, 100)}${firstUserMessage.length > 100 ? '...' : ''}"`;

  if (userMessages.length > 1 && lastUserMessage !== firstUserMessage) {
    summary += `\nFinal question: "${lastUserMessage.slice(0, 100)}${lastUserMessage.length > 100 ? '...' : ''}"`;
  }

  summary += `\nTotal messages: ${transcripts.length}`;
  summary += `\nDuration: ${Math.round((transcripts[transcripts.length - 1]?.timestamp - transcripts[0]?.timestamp) / 1000 / 60)} minutes`;

  return summary;
}

// ============================================
// Voice Chat Availability Check
// ============================================

export async function checkVoiceChatAvailability(): Promise<{
  available: boolean;
  reason?: string;
}> {
  // Check for API key
  const apiKey = import.meta.env.VITE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    return { available: false, reason: 'Please configure your Gemini API key in Settings to enable voice chat' };
  }

  // Check for secure context (HTTPS or localhost)
  if (!window.isSecureContext) {
    return { available: false, reason: 'Voice chat requires HTTPS. Please use a secure connection.' };
  }

  // Check for microphone permission
  try {
    const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    if (permission.state === 'denied') {
      return { available: false, reason: 'Microphone access was denied. Please allow microphone access in browser settings.' };
    }
  } catch {
    // Permissions API not supported, will check during actual access
  }

  // Check for required APIs
  if (!navigator.mediaDevices?.getUserMedia) {
    return { available: false, reason: 'Browser does not support audio recording' };
  }

  if (!window.AudioContext && !(window as any).webkitAudioContext) {
    return { available: false, reason: 'Browser does not support audio processing' };
  }

  return { available: true };
}
