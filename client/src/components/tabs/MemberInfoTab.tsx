import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { AlertBanner } from "@/components/AlertBanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertCommunityMemberSchema } from "@shared/schema";

const formSchema = z.object({
  email: z.string().trim().email("Invalid email address").optional().or(z.literal('')),
  displayName: z.string().trim().min(1, "Display name is required").max(100, "Display name too long").optional().or(z.literal('')),
  discordHandle: z.string().trim().min(1, "Discord handle is required").max(50, "Discord handle too long").optional().or(z.literal('')),
  country: z.string().trim().min(1, "Country is required").max(100, "Country too long").optional().or(z.literal('')),
}).refine(
  (data) => data.email || data.displayName,
  { message: "At least one of email or display name is required", path: ["email"] }
);

type FormData = z.infer<typeof formSchema>;

const countries = [
  "United States", "Canada", "United Kingdom", "Australia", "Germany",
  "France", "Japan", "China", "India", "Brazil", "Mexico", "Spain",
  "Italy", "Netherlands", "South Korea", "Singapore", "Other"
];

export function MemberInfoTab() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      displayName: '',
      discordHandle: '',
      country: '',
    },
  });

  const saveMemberMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest('POST', '/api/community/members', {
        ...data,
        walletAddress: address,
      });
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: 'Profile saved',
        description: 'Your community member information has been saved successfully.',
      });
    },
    onError: (error: any) => {
      const errorData = error.response?.data || error;
      toast({
        title: error.status === 403 ? 'Access denied' : 'Failed to save',
        description: errorData.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    setIsSuccess(false);
    saveMemberMutation.mutate(data);
  };

  return (
    <div>
      {!isConnected && (
        <div className="mb-6">
          <AlertBanner
            type="info"
            message="Connect your wallet to register your community member information."
          />
        </div>
      )}

      {isSuccess && (
        <div className="mb-6">
          <AlertBanner
            type="success"
            message="Your community profile has been saved successfully!"
          />
        </div>
      )}

      <Card className="rounded-2xl border border-white/10 bg-card/50 backdrop-blur-xl p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold font-heading mb-2">Community Member Profile</h3>
          <p className="text-sm text-muted-foreground">
            Share your information with the KingDAO community. Your wallet address is automatically captured.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your preferred name"
                      disabled={!isConnected || saveMemberMutation.isPending}
                      data-testid="input-display-name"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    How you'd like to be addressed in the community
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discordHandle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discord Handle</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="username#1234"
                      disabled={!isConnected || saveMemberMutation.isPending}
                      data-testid="input-discord-handle"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your Discord username for community coordination
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="your.email@example.com"
                      disabled={!isConnected || saveMemberMutation.isPending}
                      data-testid="input-email"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: For important DAO updates and announcements
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!isConnected || saveMemberMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-country">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem
                          key={country}
                          value={country}
                          data-testid={`select-item-country-${country.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Optional: Helps us understand our global community
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4">
              <Button
                type="submit"
                disabled={!isConnected || saveMemberMutation.isPending}
                className="w-full sm:w-auto"
                data-testid="button-save-member-info"
              >
                {saveMemberMutation.isPending ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
