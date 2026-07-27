import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import RoleSelector from "@/features/auth/components/RoleSelector";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserSchemaType,
  type UpdateUserSchemaType,
} from "@/features/users/schema";
import type { ManagedUser } from "@/features/users/types";
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

const selectClassName =
  "h-12 w-full rounded-xl border border-input/80 bg-muted/40 px-4 text-sm shadow-sm transition-all duration-200 hover:border-input hover:bg-background focus-visible:border-primary/40 focus-visible:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10";

interface UserFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  user?: ManagedUser | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onCreate: (data: CreateUserSchemaType) => void;
  onUpdate: (data: UpdateUserSchemaType) => void;
}

export default function UserFormDialog({
  open,
  mode,
  user,
  isSubmitting,
  onClose,
  onCreate,
  onUpdate,
}: UserFormDialogProps) {
  const isEdit = mode === "edit";

  const createForm = useForm<CreateUserSchemaType>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      userCode: "",
      password: "",
      role: "STUDENT",
      status: "ACTIVE",
    },
  });

  const editForm = useForm<UpdateUserSchemaType>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      userCode: "",
      role: "STUDENT",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (!open) return;

    if (isEdit && user) {
      editForm.reset({
        fullName: user.fullName,
        email: user.email,
        userCode: user.userCode,
        role: user.role,
        status: user.status,
      });
    } else if (!isEdit) {
      createForm.reset({
        fullName: "",
        email: "",
        userCode: "",
        password: "",
        role: "STUDENT",
        status: "ACTIVE",
      });
    }
  }, [open, isEdit, user, createForm, editForm]);

  if (!open) return null;

  const title = isEdit ? "Edit user" : "Create user";
  const description = isEdit
    ? "Update account details, role, and status. Role changes apply on next login or token refresh."
    : "Provision a new account. Active users can sign in immediately.";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-form-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div
        className="relative z-10 w-full max-w-lg rounded-2xl border border-border/60 bg-card p-6 shadow-panel motion-safe:animate-fade-up sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">User management</p>
            <h2 id="user-form-title" className="mt-1 text-2xl font-bold tracking-tight">
              {title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isEdit ? (
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onUpdate)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="Nguyen Van A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="user@academy.edu"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="userCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User code</FormLabel>
                    <FormControl>
                      <Input placeholder="STU004" className="font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <RoleSelector
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select
                        className={selectClassName}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                      >
                        <option value="ACTIVE">Active — can sign in</option>
                        <option value="INACTIVE">Inactive — cannot sign in</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  isLoading={isSubmitting}
                >
                  Save changes
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(onCreate)}
              className="space-y-4"
            >
              <FormField
                control={createForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="Nguyen Van A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="user@academy.edu"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="userCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User code</FormLabel>
                    <FormControl>
                      <Input placeholder="STU004" className="font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Minimum 6 characters"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <RoleSelector
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select
                        className={selectClassName}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                      >
                        <option value="ACTIVE">Active — can sign in</option>
                        <option value="INACTIVE">Inactive — cannot sign in</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  isLoading={isSubmitting}
                >
                  Create user
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
