import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const authFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthFormValues = z.infer<typeof authFormSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { loginMutation, registerMutation, user } = useAuth();
  const [, navigate] = useLocation();

  // If user is already logged in, redirect to home page
  if (user) {
    navigate("/");
    return null;
  }

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function onSubmit(data: AuthFormValues) {
    if (activeTab === "login") {
      loginMutation.mutate(data, {
        onSuccess: (userData) => {
          console.log("Login successful, redirecting to home...", userData);
          // Force a small delay before redirecting to ensure state is updated
          setTimeout(() => {
            navigate("/");
          }, 100);
        }
      });
    } else {
      registerMutation.mutate(data, {
        onSuccess: (userData) => {
          console.log("Registration successful, redirecting to home...", userData);
          // Force a small delay before redirecting to ensure state is updated
          setTimeout(() => {
            navigate("/");
          }, 100);
        }
      });
    }
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* Form section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center font-bold text-primary">
              TrackWise
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === "login" 
                ? "Welcome back! Log in to access your expense tracker" 
                : "Create an account to start tracking your expenses"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Log in"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              <TabsContent value="register">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground">
            {activeTab === "login" 
              ? "Don't have an account? Click Register above" 
              : "Already have an account? Click Login above"}
          </CardFooter>
        </Card>
      </div>

      {/* Hero section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-purple-600 text-white flex-col items-center justify-center p-12">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-6">Smart Expense Tracking</h1>
          <p className="text-lg mb-8">
            Take control of your finances with TrackWise - the smart expense tracker that helps you save money with personalized insights.
          </p>
          <div className="grid grid-cols-2 gap-6 text-left">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Track Expenses</h3>
                <p className="text-sm text-white/80">Easily log and categorize all your expenses</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Visualize Data</h3>
                <p className="text-sm text-white/80">See where your money goes with intuitive charts</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Set Budgets</h3>
                <p className="text-sm text-white/80">Create budgets and track your spending</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">AI Insights</h3>
                <p className="text-sm text-white/80">Get personalized tips to save money</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
