import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  href?: string;
}

export function Logo({ className = "", width = 240, height = 80, href = "/" }: LogoProps) {
  const content = (
    <div className={`relative flex items-center ${className}`} style={{ width, height, maxWidth: "100%" }}>
      <Image 
        src="/logo.png" 
        alt="CYBERVEST: Quantify Explain Optimize Defend" 
        fill
        className="object-contain object-left"
        unoptimized
        priority
      />
    </div>
  );

  if (href) {
    return <Link href={href} className="inline-block hover:opacity-90 transition-opacity">{content}</Link>;
  }
  
  return content;
}
