import { useState } from "react";
import AppShell from "@/components/layout/app-shell";
import QRCodeComponent from "@/components/qr-code";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "lucide-react";

export default function QRCodePage() {
  const [customValue, setCustomValue] = useState("");
  const [generatedValue, setGeneratedValue] = useState("");
  const [qrType, setQrType] = useState("app");
  
  // Get current app URL
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  
  // Default QR code value is the app URL
  const defaultQrValue = appUrl;

  const handleGenerateQR = () => {
    if (qrType === "custom" && customValue) {
      setGeneratedValue(customValue);
    } else {
      setGeneratedValue(defaultQrValue);
    }
  };

  return (
    <AppShell activeTab="qr-code">
      <div className="container py-6 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">QR Code Generator</h1>
          <p className="text-muted-foreground">Generate QR codes for TrackWise or custom links</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate QR Code</CardTitle>
              <CardDescription>Choose what QR code you want to generate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="app" onValueChange={setQrType}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="app">App Link</TabsTrigger>
                  <TabsTrigger value="custom">Custom Link</TabsTrigger>
                </TabsList>
              </Tabs>

              {qrType === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="custom-link">Custom URL or Text</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="custom-link"
                      placeholder="https://example.com or any text"
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {qrType === "app" && (
                <div className="flex items-center rounded-md px-3 py-2 bg-muted">
                  <Link className="h-4 w-4 mr-2 text-primary" />
                  <span className="text-sm font-medium">{defaultQrValue}</span>
                </div>
              )}

              <Button onClick={handleGenerateQR} className="w-full">
                Generate QR Code
              </Button>
            </CardContent>
          </Card>

          <div>
            {generatedValue ? (
              <QRCodeComponent 
                value={generatedValue}
                title="Your QR Code"
                description={qrType === "app" ? "Scan to access TrackWise on mobile" : "Scan to access the provided link"}
              />
            ) : (
              <Card className="h-full flex flex-col items-center justify-center p-6 text-center">
                <CardDescription className="text-lg">
                  Generate a QR code from the options on the left
                </CardDescription>
              </Card>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How to Use QR Codes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border p-3">
                <h3 className="font-medium mb-1">Generate</h3>
                <p className="text-sm text-muted-foreground">Create a QR code for the TrackWise app or any custom URL</p>
              </div>
              <div className="rounded-lg border p-3">
                <h3 className="font-medium mb-1">Share</h3>
                <p className="text-sm text-muted-foreground">Download and share the QR code with others</p>
              </div>
              <div className="rounded-lg border p-3">
                <h3 className="font-medium mb-1">Scan</h3>
                <p className="text-sm text-muted-foreground">Use your phone's camera or a QR scanner to access the link</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}