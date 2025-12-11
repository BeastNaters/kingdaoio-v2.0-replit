import { Client, GatewayIntentBits, Message, Collection } from 'discord.js';

let connectionSettings: any;

interface CachedAnnouncements {
  data: any[];
  timestamp: number;
}

const announcementsCache: Map<string, CachedAnnouncements> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getBotToken() {
  if (process.env.DISCORD_BOT_TOKEN) {
    return process.env.DISCORD_BOT_TOKEN;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (xReplitToken && hostname) {
    try {
      const response = await fetch(
        'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=discord',
        {
          headers: {
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': xReplitToken
          }
        }
      );
      
      const data = await response.json();
      connectionSettings = data.items?.[0];

      if (connectionSettings?.settings) {
        const token = connectionSettings.settings?.bot_token || 
                      connectionSettings.settings?.access_token;
        if (token) return token;
      }
    } catch (err) {
      console.log('Replit connector not available, checking for DISCORD_BOT_TOKEN secret');
    }
  }

  throw new Error('DISCORD_BOT_TOKEN secret not configured. Please add your Discord bot token to Replit Secrets.');
}

async function getUncachableDiscordClient() {
  const token = await getBotToken();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds, 
      GatewayIntentBits.GuildMessages
    ]
  });

  await client.login(token);
  return client;
}

interface DiscordAnnouncementSettings {
  guildId?: string;
  channelId?: string;
  enabled: boolean;
}

export async function fetchDiscordAnnouncements(
  settings?: DiscordAnnouncementSettings, 
  limit: number = 10,
  before?: string
) {
  const mockAnnouncements = [
    {
      id: '1',
      title: 'New Treasury Dashboard Launch',
      content: 'Excited to announce our new token-gated treasury dashboard for Kong NFT holders! Check it out and let us know your feedback.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      author: 'KingDAO Team',
    },
    {
      id: '2',
      title: 'Governance Proposal #5 Now Live',
      content: 'A new proposal for treasury allocation has been posted on Snapshot. All Kong holders can vote until Friday.',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      author: 'Governance Committee',
    },
    {
      id: '3',
      title: 'Monthly Community Call',
      content: 'Join us this Thursday at 5PM UTC for our monthly community call. We\'ll discuss Q1 treasury performance and upcoming initiatives.',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      author: 'Community Manager',
    },
  ];

  if (!settings?.enabled || !settings?.guildId || !settings?.channelId) {
    console.log('Discord not configured, returning mock announcements');
    return mockAnnouncements;
  }

  const cacheKey = `${settings.guildId}-${settings.channelId}-${limit}-${before || 'latest'}`;
  const cached = announcementsCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log('Returning cached Discord announcements');
    return cached.data;
  }

  let client: Client | null = null;
  
  try {
    client = await getUncachableDiscordClient();
    
    const guild = await client.guilds.fetch(settings.guildId);
    if (!guild) {
      console.error('Discord guild not found:', settings.guildId);
      return mockAnnouncements;
    }

    const channel = await guild.channels.fetch(settings.channelId);
    if (!channel || !channel.isTextBased()) {
      console.error('Discord channel not found or not text-based:', settings.channelId);
      return mockAnnouncements;
    }

    const fetchOptions: any = { limit: Math.min(limit, 50) };
    if (before) {
      fetchOptions.before = before;
    }
    
    const messages = await channel.messages.fetch(fetchOptions);
    
    const messageArray: Message[] = [];
    messages.forEach((msg) => messageArray.push(msg));
    
    const announcements = messageArray
      .map(msg => ({
        id: msg.id,
        title: (msg.content || 'No content').split('\n')[0].slice(0, 100),
        content: msg.content || 'Message content unavailable',
        timestamp: msg.createdAt.toISOString(),
        author: msg.author.username,
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const result = announcements.length > 0 ? announcements : mockAnnouncements;
    
    announcementsCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });
    
    return result;
  } catch (error: any) {
    console.error('Error fetching Discord announcements:', error);
    return mockAnnouncements;
  } finally {
    if (client) {
      await client.destroy();
    }
  }
}
