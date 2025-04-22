import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, DownloadCloud } from "lucide-react";

interface QRCodeProps {
  value: string;
  title?: string;
  description?: string;
  size?: number;
}

export default function QRCodeComponent({ 
  value, 
  title = "Scan QR Code", 
  description = "Scan to access on mobile device",
  size = 200 
}: QRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setIsLoading(true);
        const dataUrl = await QRCode.toDataURL(value, {
          width: size,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#FFFFFF"
          }
        });
        setQrCodeUrl(dataUrl);
      } catch (error) {
        console.error("Error generating QR code:", error);
      } finally {
        setIsLoading(false);
      }
    };

    generateQRCode();
  }, [value, size]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = "trackwise-qrcode.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center" style={{ width: size, height: size }}>
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-white p-4 rounded-lg">
            <img src={qrCodeUrl} alt="QR Code" className="rounded-md" />
          </div>
        )}
        
        <Button variant="outline" onClick={handleDownload} className="mt-4 flex gap-2">
          <DownloadCloud className="h-4 w-4" />
          Download QR Code
        </Button>
      </CardContent>
    </Card>
  );
}