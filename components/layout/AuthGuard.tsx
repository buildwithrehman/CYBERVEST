"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/auth/supabase";
import { LoadingState } from "@/components/ui/States";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        if (!session) {
          router.push(`/login?redirect=\${encodeURIComponent(pathname)}`);
        } else {
          setIsAuthenticated(true);
        }
      }
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && mounted) {
        setIsAuthenticated(false);
        router.push("/login");
      } else if (session && mounted) {
        setIsAuthenticated(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  if (isAuthenticated === null) {
    return <LoadingState message="Authenticating..." />;
  }

  if (isAuthenticated === false) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
