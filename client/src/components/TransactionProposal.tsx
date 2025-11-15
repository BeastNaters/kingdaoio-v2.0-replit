import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useAccount } from 'wagmi';

const transactionSchema = z.object({
  safeAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Safe address"),
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid recipient address"),
  value: z.string().regex(/^\d+$/, "Value must be in wei"),
  data: z.string().optional(),
  operation: z.enum(['0', '1']),
  chainId: z.string(),
  description: z.string().min(1, "Description is required").max(500),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export function TransactionProposal() {
  const { address } = useAccount();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      safeAddress: import.meta.env.VITE_SAFE_ADDRESS || '',
      to: '',
      value: '0',
      data: '0x',
      operation: '0',
      chainId: '1',
      description: '',
    },
  });

  const proposeMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      return await apiRequest('/api/safe/propose-transaction', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          chainId: parseInt(data.chainId),
          operation: parseInt(data.operation),
          createdBy: address,
        }),
      });
    },
    onSuccess: (response) => {
      toast({
        title: 'Transaction Proposed',
        description: `Transaction hash: ${response.data.safeTxHash.slice(0, 10)}...`,
      });
      form.reset();
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['/api/safe/transactions'] });
    },
    onError: (err: any) => {
      const errorMessage = err.message || 'Failed to propose transaction';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: TransactionFormData) => {
    setError(null);
    proposeMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Propose Safe Transaction
        </CardTitle>
        <CardDescription>
          Create a new transaction proposal for multi-signature approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="safeAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Safe Address</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="0x..." 
                      data-testid="input-safe-address"
                    />
                  </FormControl>
                  <FormDescription>
                    The Safe wallet address to execute from
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Address</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="0x..." 
                      data-testid="input-recipient-address"
                    />
                  </FormControl>
                  <FormDescription>
                    The address to send funds or interact with
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value (Wei)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="0" 
                        data-testid="input-value"
                      />
                    </FormControl>
                    <FormDescription>
                      Amount in wei (1 ETH = 10^18 wei)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="chainId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chain</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-chain">
                          <SelectValue placeholder="Select chain" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Ethereum Mainnet</SelectItem>
                        <SelectItem value="11155111">Sepolia</SelectItem>
                        <SelectItem value="100">Gnosis Chain</SelectItem>
                        <SelectItem value="137">Polygon</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="operation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operation Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-operation">
                        <SelectValue placeholder="Select operation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Call</SelectItem>
                      <SelectItem value="1">DelegateCall</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Call for regular transactions, DelegateCall for contract interactions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Data (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="0x" 
                      data-testid="input-data"
                    />
                  </FormControl>
                  <FormDescription>
                    Encoded function call data (leave as 0x for simple transfers)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Describe the purpose of this transaction..."
                      className="resize-none"
                      rows={3}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormDescription>
                    Explain what this transaction does and why it's needed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={proposeMutation.isPending}
              data-testid="button-propose-transaction"
            >
              {proposeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Propose Transaction
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
