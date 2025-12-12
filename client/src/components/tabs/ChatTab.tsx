import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AlertBanner } from "@/components/AlertBanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";
import type { CommunityMessage } from "@shared/schema";

type ChatChannel = 'general' | 'treasury' | 'governance';

export function ChatTab() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const [activeChannel, setActiveChannel] = useState<ChatChannel>('general');
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messagesData, isLoading: isLoadingMessages } = useQuery<{success: boolean, data: CommunityMessage[]}>({
    queryKey: ['/api/community/messages', activeChannel],
    queryFn: async () => {
      const res = await fetch(`/api/community/messages?channel=${activeChannel}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: isConnected,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const messages = messagesData?.data || [];

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('community:new-message', (data: { channel: string, message: CommunityMessage }) => {
      if (data.channel === activeChannel) {
        queryClient.invalidateQueries({ queryKey: ['/api/community/messages', activeChannel] });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const postMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return apiRequest('POST', '/api/community/messages', {
        walletAddress: address,
        message,
        channel: activeChannel,
        username: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : undefined,
      });
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/community/messages', activeChannel] });
      toast({ title: 'Message posted', description: 'Your message has been shared with the community.' });
    },
    onError: (error: any) => {
      const errorData = error.response?.data || error;
      toast({
        title: errorData.retryAfter ? 'Rate limit exceeded' : error.status === 403 ? 'Access denied' : 'Failed to post message',
        description: errorData.retryAfter ? `Please wait ${errorData.retryAfter} seconds` : errorData.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected) return;
    postMessageMutation.mutate(newMessage.trim());
  };

  return (
    <div>
      {!isConnected && (
        <div className="mb-6">
          <AlertBanner
            type="info"
            message="Connect your wallet to participate in community chat."
          />
        </div>
      )}

      <Tabs value={activeChannel} onValueChange={(v) => setActiveChannel(v as ChatChannel)}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
          <TabsTrigger value="treasury" data-testid="tab-treasury">Treasury</TabsTrigger>
          <TabsTrigger value="governance" data-testid="tab-governance">Governance</TabsTrigger>
        </TabsList>

        {(['general', 'treasury', 'governance'] as ChatChannel[]).map((channel) => (
          <TabsContent key={channel} value={channel}>
            <Card className="rounded-2xl border border-white/10 bg-card/50 backdrop-blur-xl overflow-hidden">
              <div className="h-96 flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid={`chat-messages-container-${channel}`}>
                  {isLoadingMessages ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 rounded-lg" />
                      ))}
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className="rounded-lg border border-white/5 bg-background/30 p-3"
                        data-testid={`message-${msg.id}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-accent">
                            {msg.username || `${msg.walletAddress.slice(0, 6)}...${msg.walletAddress.slice(-4)}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{msg.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>No messages yet. Be the first to say hello!</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-white/10 p-4">
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={isConnected ? "Type your message..." : "Connect wallet to post"}
                      disabled={!isConnected || postMessageMutation.isPending}
                      className="resize-none min-h-0 h-10"
                      maxLength={1000}
                      data-testid={`input-chat-message-${channel}`}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!isConnected || !newMessage.trim() || postMessageMutation.isPending}
                      data-testid={`button-send-message-${channel}`}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{socketConnected ? '● Connected' : '○ Disconnected'}</span>
                    <span>{newMessage.length}/1000</span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
