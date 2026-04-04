// ============================================================================
// Agent Communication Protocol (ACP)
// Message bus for inter-agent communication
// ============================================================================

export interface ACPMessage {
  id: string;
  timestamp: number;
  sender: string;
  recipients: string[] | 'broadcast';
  type: ACPMessageType;
  payload: any;
  priority: number;
  ttl: number; // Time to live (ms)
  metadata: {
    correlationId: string;
    app: 'physiomotion' | 'dealflow';
    version: string;
  };
}

export type ACPMessageType = 
  | 'TASK_REQUEST'
  | 'TASK_RESPONSE'
  | 'QUERY'
  | 'QUERY_RESPONSE'
  | 'DEBATE_INIT'
  | 'DEBATE_RESPONSE'
  | 'CONSENSUS_PROPOSE'
  | 'CONSENSUS_ACCEPT'
  | 'CONSENSUS_REJECT'
  | 'ERROR'
  | 'HEARTBEAT';

export interface ACPSubscription {
  id: string;
  agentId: string;
  messageTypes: ACPMessageType[];
  filter?: (message: ACPMessage) => boolean;
  handler: (message: ACPMessage) => Promise<void> | void;
}

// ============================================================================
// Agent Communication Bus
// ============================================================================

class AgentCommunicationBus {
  private subscriptions: Map<string, ACPSubscription> = new Map();
  private messageHistory: ACPMessage[] = [];
  private maxHistorySize = 1000;
  private messageHandlers: Map<ACPMessageType, Set<string>> = new Map();
  
  constructor() {
    this.initializeHandlers();
  }
  
  private initializeHandlers() {
    const types: ACPMessageType[] = [
      'TASK_REQUEST', 'TASK_RESPONSE', 'QUERY', 'QUERY_RESPONSE',
      'DEBATE_INIT', 'DEBATE_RESPONSE', 'CONSENSUS_PROPOSE',
      'CONSENSUS_ACCEPT', 'CONSENSUS_REJECT', 'ERROR', 'HEARTBEAT'
    ];
    
    types.forEach(type => {
      this.messageHandlers.set(type, new Set());
    });
  }
  
  // Subscribe an agent to message types
  subscribe(subscription: Omit<ACPSubscription, 'id'>): string {
    const id = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullSubscription: ACPSubscription = { ...subscription, id };
    
    this.subscriptions.set(id, fullSubscription);
    
    // Register handlers for each message type
    subscription.messageTypes.forEach(type => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.add(id);
      }
    });
    
    console.log(`📡 ${subscription.agentId} subscribed to ${subscription.messageTypes.join(', ')}`);
    return id;
  }
  
  // Unsubscribe
  unsubscribe(subscriptionId: string): boolean {
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub) return false;
    
    sub.messageTypes.forEach(type => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(subscriptionId);
      }
    });
    
    this.subscriptions.delete(subscriptionId);
    return true;
  }
  
  // Publish message to bus
  async publish(message: Omit<ACPMessage, 'id' | 'timestamp'>): Promise<void> {
    const fullMessage: ACPMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    // Store in history
    this.messageHistory.push(fullMessage);
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.shift();
    }
    
    // Route to recipients
    const targetSubIds = this.resolveRecipients(fullMessage);
    
    // Deliver to handlers
    const deliveryPromises = targetSubIds.map(async (subId) => {
      const sub = this.subscriptions.get(subId);
      if (!sub) return;
      
      // Apply filter if present
      if (sub.filter && !sub.filter(fullMessage)) {
        return;
      }
      
      try {
        await sub.handler(fullMessage);
      } catch (error) {
        console.error(`[ACP] Handler error for ${sub.agentId}:`, error);
      }
    });
    
    await Promise.all(deliveryPromises);
  }
  
  // Resolve recipients based on message
  private resolveRecipients(message: ACPMessage): string[] {
    const targetIds = new Set<string>();
    
    if (message.recipients === 'broadcast') {
      // All handlers for this message type
      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        handlers.forEach(id => targetIds.add(id));
      }
    } else {
      // Specific recipients
      message.recipients.forEach(agentId => {
        // Find subscription for this agent
        this.subscriptions.forEach((sub, subId) => {
          if (sub.agentId === agentId && sub.messageTypes.includes(message.type)) {
            targetIds.add(subId);
          }
        });
      });
    }
    
    return Array.from(targetIds);
  }
  
  // Query message history
  queryHistory(options: {
    sender?: string;
    recipient?: string;
    type?: ACPMessageType;
    correlationId?: string;
    since?: number;
    limit?: number;
  }): ACPMessage[] {
    let results = this.messageHistory;
    
    if (options.sender) {
      results = results.filter(m => m.sender === options.sender);
    }
    
    if (options.recipient) {
      results = results.filter(m => 
        m.recipients === 'broadcast' || 
        m.recipients.includes(options.recipient!)
      );
    }
    
    if (options.type) {
      results = results.filter(m => m.type === options.type);
    }
    
    if (options.correlationId) {
      results = results.filter(m => m.metadata.correlationId === options.correlationId);
    }
    
    if (options.since) {
      results = results.filter(m => m.timestamp >= options.since!);
    }
    
    const limit = options.limit || 100;
    return results.slice(-limit);
  }
  
  // Get bus statistics
  getStats(): {
    totalSubscriptions: number;
    totalMessages: number;
    messagesByType: Record<string, number>;
  } {
    const messagesByType: Record<string, number> = {};
    
    this.messageHistory.forEach(msg => {
      messagesByType[msg.type] = (messagesByType[msg.type] || 0) + 1;
    });
    
    return {
      totalSubscriptions: this.subscriptions.size,
      totalMessages: this.messageHistory.length,
      messagesByType
    };
  }
  
  // Cleanup expired messages
  cleanup(): void {
    const now = Date.now();
    this.messageHistory = this.messageHistory.filter(msg => {
      return (now - msg.timestamp) < msg.ttl;
    });
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const ACPBus = new AgentCommunicationBus();

// ============================================================================
// Agent Base Class using ACP
// ============================================================================

export abstract class BaseAgent {
  protected id: string;
  protected name: string;
  protected capabilities: string[];
  protected subscriptionIds: string[] = [];
  protected messageLog: ACPMessage[] = [];
  
  constructor(config: {
    id: string;
    name: string;
    capabilities: string[];
  }) {
    this.id = config.id;
    this.name = config.name;
    this.capabilities = config.capabilities;
  }
  
  // Initialize agent subscriptions
  initialize(): void {
    // Subscribe to task requests
    const taskSub = ACPBus.subscribe({
      agentId: this.id,
      messageTypes: ['TASK_REQUEST', 'QUERY', 'DEBATE_INIT'],
      filter: (msg) => {
        // Only handle messages addressed to this agent or broadcast
        return msg.recipients === 'broadcast' || 
               (Array.isArray(msg.recipients) && msg.recipients.includes(this.id));
      },
      handler: (msg) => this.handleMessage(msg)
    });
    
    this.subscriptionIds.push(taskSub);
    console.log(`🤖 ${this.name} initialized`);
  }
  
  // Shutdown agent
  shutdown(): void {
    this.subscriptionIds.forEach(id => ACPBus.unsubscribe(id));
    this.subscriptionIds = [];
    console.log(`🛑 ${this.name} shutdown`);
  }
  
  // Abstract message handler
  protected abstract handleMessage(message: ACPMessage): Promise<void>;
  
  // Send response
  protected async respond(
    originalMessage: ACPMessage,
    payload: any,
    type: ACPMessageType = 'TASK_RESPONSE'
  ): Promise<void> {
    await ACPBus.publish({
      sender: this.id,
      recipients: [originalMessage.sender],
      type,
      payload,
      priority: originalMessage.priority,
      ttl: 60000, // 1 minute TTL
      metadata: {
        correlationId: originalMessage.metadata.correlationId,
        app: originalMessage.metadata.app,
        version: '1.0'
      }
    });
  }
  
  // Broadcast to all agents
  protected async broadcast(
    payload: any,
    type: ACPMessageType,
    app: 'physiomotion' | 'dealflow'
  ): Promise<void> {
    await ACPBus.publish({
      sender: this.id,
      recipients: 'broadcast',
      type,
      payload,
      priority: 5,
      ttl: 30000,
      metadata: {
        correlationId: `broadcast-${Date.now()}`,
        app,
        version: '1.0'
      }
    });
  }
  
  // Query another agent
  protected async query(
    targetAgentId: string,
    payload: any,
    timeout: number = 5000
  ): Promise<any> {
    const correlationId = `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return new Promise(async (resolve, reject) => {
      // Set timeout
      const timer = setTimeout(() => {
        reject(new Error(`Query to ${targetAgentId} timed out`));
      }, timeout);
      
      // Temporary subscription for response
      const subId = ACPBus.subscribe({
        agentId: `${this.id}-temp-query`,
        messageTypes: ['QUERY_RESPONSE'],
        filter: (msg) => 
          msg.metadata.correlationId === correlationId &&
          msg.sender === targetAgentId,
        handler: (msg) => {
          clearTimeout(timer);
          ACPBus.unsubscribe(subId);
          resolve(msg.payload);
        }
      });
      
      // Send query
      await ACPBus.publish({
        sender: this.id,
        recipients: [targetAgentId],
        type: 'QUERY',
        payload,
        priority: 8,
        ttl: timeout,
        metadata: {
          correlationId,
          app: 'physiomotion', // Would be dynamic
          version: '1.0'
        }
      });
    });
  }
  
  // Get agent info
  getInfo(): { id: string; name: string; capabilities: string[] } {
    return {
      id: this.id,
      name: this.name,
      capabilities: this.capabilities
    };
  }
}

export default ACPBus;
