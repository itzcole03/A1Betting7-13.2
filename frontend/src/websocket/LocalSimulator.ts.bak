/**
 * WebSocket Local Simulation Mode
 * 
 * Provides synthetic data when backend is unavailable, clearly labeled
 * to avoid confusion with real data. Simulates realistic betting data
 * with proper timing and variation patterns.
 */

import { 
  WSMessageEnvelope, 
  WSSimulationConfig, 
  WSMessagePriority,
  WSCompressionType,
  WS_MESSAGE_TYPES,
  WS_PROTOCOL_VERSION,
  DEFAULT_SIMULATION_CONFIG
} from './protocol-types';

export interface SimulationDataGenerator<T = unknown> {
  generate(): T;
  getNextUpdateTime(): number;
  isActive(): boolean;
  setActive(active: boolean): void;
}

export class WSLocalSimulator {
  private config: WSSimulationConfig;
  private generators: Map<string, SimulationDataGenerator>;
  private intervals: Map<string, NodeJS.Timeout>;
  private messageListeners: Set<(message: WSMessageEnvelope) => void>;
  private isActive: boolean = false;
  private simulationStartTime: number = 0;
  private messageSequence: number = 0;

  constructor(config: WSSimulationConfig = DEFAULT_SIMULATION_CONFIG) {
    this.config = { ...DEFAULT_SIMULATION_CONFIG, ...config };
    this.generators = new Map();
    this.intervals = new Map();
    this.messageListeners = new Set();
    this.initializeDefaultGenerators();
  }

  /**
   * Start local simulation mode
   */
  start(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.simulationStartTime = Date.now();
    this.messageSequence = 0;

    // Send simulation start notification
    this.sendMessage({
      type: WS_MESSAGE_TYPES.UPDATE,
      payload: {
        channel: 'system',
        operation: 'create',
        data: {
          type: 'simulation_started',
          message: '⚠️ Local simulation mode active - backend unavailable',
          timestamp: new Date().toISOString()
        },
        timestamp: Date.now(),
        sequenceNumber: this.getNextSequence()
      }
    });

    // Start generators for configured channels
    this.config.channels.forEach(channel => {
      this.startChannelSimulation(channel);
    });
  }

  /**
   * Stop local simulation mode
   */
  stop(): void {
    if (!this.isActive) return;

    this.isActive = false;
    
    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();

    // Send simulation stop notification
    this.sendMessage({
      type: WS_MESSAGE_TYPES.UPDATE,
      payload: {
        channel: 'system',
        operation: 'update',
        data: {
          type: 'simulation_stopped',
          message: '✅ Simulation mode deactivated',
          timestamp: new Date().toISOString()
        },
        timestamp: Date.now(),
        sequenceNumber: this.getNextSequence()
      }
    });
  }

  /**
   * Check if simulation is active
   */
  isSimulationActive(): boolean {
    return this.isActive;
  }

  /**
   * Add message listener
   */
  addMessageListener(listener: (message: WSMessageEnvelope) => void): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  /**
   * Register custom data generator
   */
  registerGenerator<T>(channel: string, generator: SimulationDataGenerator<T>): void {
    this.generators.set(channel, generator);
  }

  /**
   * Update simulation configuration
   */
  updateConfig(config: Partial<WSSimulationConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.isActive) {
      // Restart with new config
      this.stop();
      this.start();
    }
  }

  /**
   * Get simulation statistics
   */
  getStats(): {
    isActive: boolean;
    uptimeMs: number;
    messagesSent: number;
    activeChannels: string[];
    generatorsRegistered: number;
  } {
    return {
      isActive: this.isActive,
      uptimeMs: this.isActive ? Date.now() - this.simulationStartTime : 0,
      messagesSent: this.messageSequence,
      activeChannels: Array.from(this.intervals.keys()),
      generatorsRegistered: this.generators.size
    };
  }

  /**
   * Start simulation for specific channel
   */
  private startChannelSimulation(channel: string): void {
    const generator = this.generators.get(channel);
    if (!generator) return;

    const interval = setInterval(() => {
      if (!this.isActive || !generator.isActive()) return;

      try {
        const data = generator.generate();
        this.sendMessage({
          type: WS_MESSAGE_TYPES.UPDATE,
          payload: {
            channel,
            operation: 'update',
            data,
            timestamp: Date.now(),
            sequenceNumber: this.getNextSequence()
          }
        });
      } catch {
        // Generator failed, deactivate it
        generator.setActive(false);
      }
    }, this.config.updateIntervalMs);

    this.intervals.set(channel, interval);
  }

  /**
   * Send simulated message to listeners
   */
  private sendMessage<T>(partialMessage: {
    type: string;
    payload: T;
  }): void {
    const message: WSMessageEnvelope<T> = {
      type: partialMessage.type,
      ts: Date.now(),
      correlationId: `sim-${this.getNextSequence()}-${Date.now()}`,
      payload: partialMessage.payload,
      version: WS_PROTOCOL_VERSION,
      meta: {
        source: 'simulation',
        priority: WSMessagePriority.NORMAL,
        compression: WSCompressionType.NONE
      }
    };

    this.messageListeners.forEach(listener => {
      try {
        listener(message);
      } catch {
        // Listener error - remove it
        this.messageListeners.delete(listener);
      }
    });
  }

  /**
   * Get next sequence number
   */
  private getNextSequence(): number {
    return ++this.messageSequence;
  }

  /**
   * Initialize default data generators
   */
  private initializeDefaultGenerators(): void {
    // Props generator
    this.registerGenerator('props', new PropBettingGenerator());
    
    // Odds generator  
    this.registerGenerator('odds', new OddsChangeGenerator());
    
    // Games generator
    this.registerGenerator('games', new GameStatusGenerator());
    
    // Notifications generator
    this.registerGenerator('notifications', new NotificationGenerator());
  }
}

/**
 * Prop betting data generator
 */
class PropBettingGenerator implements SimulationDataGenerator {
  private active: boolean = true;
  private lastUpdateTime: number = 0;

  generate() {
    this.lastUpdateTime = Date.now();
    
    const players = ['Aaron Judge', 'Mookie Betts', 'Ronald Acuña Jr.', 'Mike Trout', 'Manny Machado'];
    const props = ['hits', 'runs', 'RBIs', 'home_runs', 'stolen_bases'];
    const player = players[Math.floor(Math.random() * players.length)];
    const prop = props[Math.floor(Math.random() * props.length)];
    
    return {
      id: `sim-prop-${Date.now()}`,
      gameId: `sim-game-${Math.floor(Math.random() * 100) + 1}`,
      player,
      propType: prop,
      line: Math.round((Math.random() * 3 + 0.5) * 2) / 2, // 0.5, 1.0, 1.5, etc.
      overOdds: Math.floor(Math.random() * 40 - 120), // -110 to -80 range
      underOdds: Math.floor(Math.random() * 40 - 120),
      updated: new Date().toISOString(),
      simulation: true,
      sport: 'MLB'
    };
  }

  getNextUpdateTime(): number {
    return this.lastUpdateTime + 3000 + Math.random() * 2000; // 3-5 second intervals
  }

  isActive(): boolean {
    return this.active;
  }

  setActive(active: boolean): void {
    this.active = active;
  }
}

/**
 * Odds change generator
 */
class OddsChangeGenerator implements SimulationDataGenerator {
  private active: boolean = true;
  private lastUpdateTime: number = 0;

  generate() {
    this.lastUpdateTime = Date.now();
    
    const books = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'PointsBet'];
    const book = books[Math.floor(Math.random() * books.length)];
    
    return {
      id: `sim-odds-${Date.now()}`,
      propId: `sim-prop-${Math.floor(Math.random() * 1000) + 1}`,
      sportsbook: book,
      oldOdds: Math.floor(Math.random() * 40 - 120),
      newOdds: Math.floor(Math.random() * 40 - 120),
      change: Math.random() > 0.5 ? 'increase' : 'decrease',
      timestamp: new Date().toISOString(),
      simulation: true
    };
  }

  getNextUpdateTime(): number {
    return this.lastUpdateTime + 4000 + Math.random() * 3000; // 4-7 second intervals
  }

  isActive(): boolean {
    return this.active;
  }

  setActive(active: boolean): void {
    this.active = active;
  }
}

/**
 * Game status generator
 */
class GameStatusGenerator implements SimulationDataGenerator {
  private active: boolean = true;
  private lastUpdateTime: number = 0;
  private games = [
    { id: 'sim-game-1', home: 'Yankees', away: 'Red Sox' },
    { id: 'sim-game-2', home: 'Dodgers', away: 'Giants' },
    { id: 'sim-game-3', home: 'Astros', away: 'Rangers' },
    { id: 'sim-game-4', home: 'Braves', away: 'Mets' }
  ];

  generate() {
    this.lastUpdateTime = Date.now();
    
    const game = this.games[Math.floor(Math.random() * this.games.length)];
    const statuses = ['scheduled', 'live', 'final', 'postponed', 'suspended'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      ...game,
      status,
      inning: status === 'live' ? Math.floor(Math.random() * 9) + 1 : null,
      homeScore: status === 'live' || status === 'final' ? Math.floor(Math.random() * 12) : 0,
      awayScore: status === 'live' || status === 'final' ? Math.floor(Math.random() * 12) : 0,
      updated: new Date().toISOString(),
      simulation: true
    };
  }

  getNextUpdateTime(): number {
    return this.lastUpdateTime + 8000 + Math.random() * 4000; // 8-12 second intervals
  }

  isActive(): boolean {
    return this.active;
  }

  setActive(active: boolean): void {
    this.active = active;
  }
}

/**
 * Notification generator
 */
class NotificationGenerator implements SimulationDataGenerator {
  private active: boolean = true;
  private lastUpdateTime: number = 0;

  generate() {
    this.lastUpdateTime = Date.now();
    
    const messages = [
      'New prop available: Aaron Judge Over 1.5 Hits (+110)',
      'Odds change: Mookie Betts Under 2.5 Total Bases now -105',
      'Game alert: Yankees vs Red Sox delayed due to rain',
      'Arbitrage opportunity detected: Cross-book advantage 2.3%',
      'Model confidence high: Braves ML recommendation updated'
    ];
    
    const types = ['prop_alert', 'odds_change', 'game_update', 'arbitrage', 'model_update'];
    const priorities = ['LOW', 'NORMAL', 'HIGH'];
    
    return {
      id: `sim-notification-${Date.now()}`,
      type: types[Math.floor(Math.random() * types.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      timestamp: new Date().toISOString(),
      read: false,
      simulation: true
    };
  }

  getNextUpdateTime(): number {
    return this.lastUpdateTime + 10000 + Math.random() * 10000; // 10-20 second intervals
  }

  isActive(): boolean {
    return this.active;
  }

  setActive(active: boolean): void {
    this.active = active;
  }
}