import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { useTwoFactorVerifyMutation } from "@/features/auth/security/hooks/useTwoFactorVerify";
import type { TwoFactorChallenge } from "@/features/auth/security/types";

const twoFactorSchema = z.object({
  code: z
    .string()
    .min(6, { message: "Enter the 6-digit code" })
    .max(8, { message: "Code is too long" })
    .regex(/^\d+$/, { message: "Code must be numeric" }),
});

type TwoFactorSchemaType = z.infer<typeof twoFactorSchema>;

interface TwoFactorFormProps {
  challenge: TwoFactorChallenge;
  onBack: () => void;
}

/** Bước 2FA sau login — hiện khi BE trả TWO_FACTOR_REQUIRED. */
export default function TwoFactorForm({ challenge, onBack }: TwoFactorFormProps) {
  const verifyMutation = useTwoFactorVerifyMutation();

  const form = useForm<TwoFactorSchemaType>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: "" },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <ShieldCheck className="h-8 w-8 text-primary" aria-hidden />
        <div>
          <p className="font-semibold text-foreground">Two-factor verification</p>
          <p className="text-sm text-muted-foreground">
            Account: {challenge.email}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(({ code }) =>
            verifyMutation.mutate({
              challengeToken: challenge.challengeToken,
              code,
            }),
          )}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification code</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    maxLength={8}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={verifyMutation.isPending}
            disabled={verifyMutation.isPending}
          >
            Verify and continue
          </Button>
        </form>
      </Form>

      <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
        Back to login
      </Button>
    </div>
  );
}
