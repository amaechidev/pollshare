"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { Session, User, AuthError } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create supabase client instance
  const supabase = createClient();

  // Get initial session
  useEffect(() => {
    let isMounted = true;

    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting initial session:", error);
        }

        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Unexpected error getting session:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);

      setSession(session);
      setUser(session?.user ?? null);

      // Only set loading to false after initial session is loaded
      if (event === "INITIAL_SESSION") {
        setIsLoading(false);
      }

      // Handle token refresh
      if (event === "TOKEN_REFRESHED") {
        console.log("Token refreshed successfully");
      }

      // Handle sign out
      if (event === "SIGNED_OUT") {
        setUser(null);
        setSession(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error("Sign in error:", error);
        }

        return { error };
      } catch (error) {
        console.error("Unexpected sign in error:", error);
        return {
          error: new AuthError(
            error instanceof Error
              ? error.message
              : "An unexpected error occurred during sign in",
            500
          ),
        };
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        setIsLoading(true);
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        console.log("Sign up result - Error:", error);
        console.log("Sign up result - Data:", data);

        // Handle case where user already exists but Supabase returns no error (email enumeration protection)
        if (!error && !data.user && !data.session) {
          return {
            error: new AuthError(
              "If this email is not already registered, please check your email for a confirmation link.",
              400
            ),
          };
        }

        if (error) {
          console.error("Sign up error:", error);
        }

        return { error };
      } catch (error) {
        console.error("Unexpected sign up error:", error);
        return {
          error: new AuthError(
            error instanceof Error
              ? error.message
              : "An unexpected error occurred during sign up",
            500
          ),
        };
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Sign out error:", error);
      }

      return { error };
    } catch (error) {
      console.error("Unexpected sign out error:", error);
      return {
        error: new AuthError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during sign out",
          500
        ),
      };
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const refreshSession = useCallback(async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("Error refreshing session:", error);
      }
    } catch (error) {
      console.error("Unexpected error refreshing session:", error);
    }
  }, [supabase]);

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
