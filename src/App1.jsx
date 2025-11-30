import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { auth, db } from "./firebaseConfig.js";
import LoginPage from "./pages/LoginPage.jsx";
import ModeSelect from "./pages/ModeSelect.jsx";
import Home from "./pages/Home.jsx";

function SidebarPage({ username, email, onLogout, children }) {
  return (
    <SidebarProvider>
      <AppSidebar username={username} email={email} onLogout={onLogout} />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Documentation</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Introduction</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="secondary">
              Feedback
            </Button>
            <Button size="sm">Get started</Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          {children ? (
            <div className="flex flex-1 flex-col h-full">{children}</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="col-span-2 space-y-4">
                <div className="rounded-xl border bg-card p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Welcome</p>
                      <h1 className="text-2xl font-semibold">Sidebar demo</h1>
                    </div>
                    <Button>New project</Button>
                  </div>
                </div>

                <div className="rounded-xl border bg-card p-6">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-medium">Search docs</h2>
                    <Button variant="outline" size="sm">
                      View all
                    </Button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Input
                      className="w-full sm:max-w-xs"
                      placeholder="Search..."
                    />
                    <Button>Search</Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border bg-card p-6">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Quick links
                  </h3>
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
                <div className="rounded-xl border bg-card p-6">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Recent updates
                  </h3>
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function App1() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const loginPath = "/loginPage";
  const appPath = "/app1";

  const handleLogout = async () => {
    await signOut(auth);
    navigate(loginPath);
  };

  useEffect(() => {
    let unsubscribeUserDoc;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (location.pathname !== loginPath) {
          navigate(loginPath, { replace: true });
        }
        setUserName("");
        setUserEmail("");
      } else {
        const fallbackName =
          user.displayName || user.email?.split("@")[0] || "User";
        const fallbackEmail = user.email || "";

        setUserName(fallbackName);
        setUserEmail(fallbackEmail);

        if (location.pathname === loginPath) {
          navigate(appPath, { replace: true });
        }

        const userDocRef = doc(db, "users", user.uid);
        unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserName(data.username || fallbackName);
            setUserEmail(data.email || fallbackEmail);
          }
        });
      }
      setCheckingAuth(false);
    });

    return () => {
      if (unsubscribeUserDoc) unsubscribeUserDoc();
      unsubscribe();
    };
  }, [navigate, location.pathname]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route path={loginPath} element={<LoginPage />} />
      <Route
        path={appPath}
        element={
          <SidebarPage username={userName} email={userEmail} onLogout={handleLogout}>
            <Home />
          </SidebarPage>
        }
      />
      <Route
        path="/mode-select"
        element={
          <SidebarPage username={userName} email={userEmail} onLogout={handleLogout}>
            <div className="w-full">
              <ModeSelect username={userName} />
            </div>
          </SidebarPage>
        }
      />
      <Route path="*" element={<Navigate to={appPath} replace />} />
    </Routes>
  );
}
