"use client";

// Email and password, react-hook-form + zod (FE-SPEC.md §10). On success the
// API sets the session cookie; this app stores nothing itself, it just
// invalidates the cached session and moves to the shell.

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiPost } from "@/lib/api/client";
import { ApiError, mapErrorCodeToMessage } from "@/lib/api/errors";
import { useIdempotencyKey } from "@/lib/api/idempotency";
import { queryKeys } from "@/lib/query/keys";

const loginSchema = z.object({
  email: z.string().min(1, "Enter your email.").email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Every failure except a network problem gets this exact copy, regardless
// of which code the API actually returned — the login screen must never
// reveal whether an email is registered (FE-SPEC.md §14), even if the API
// itself ever distinguished "no such user" from "wrong password."
const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code === "NETWORK_ERROR") {
    return mapErrorCodeToMessage(error.code);
  }
  return INVALID_CREDENTIALS_MESSAGE;
}

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { key, reset } = useIdempotencyKey();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) => apiPost<unknown>("/auth/login", values, key),
    onSuccess: async () => {
      reset();
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      router.push("/");
    },
  });

  return (
    <main className="flex flex-1 items-center justify-center">
      <form
        onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
        noValidate
        className="w-full max-w-sm space-y-4"
      >
        <h1 className="text-xl font-semibold">Sign in to TowOS</h1>

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full rounded border border-black/20 px-3 py-2"
            {...register("email")}
          />
          {errors.email && (
            <p role="alert" className="text-sm text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded border border-black/20 px-3 py-2"
            {...register("password")}
          />
          {errors.password && (
            <p role="alert" className="text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        {loginMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {loginErrorMessage(loginMutation.error)}
          </p>
        )}

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {loginMutation.isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
