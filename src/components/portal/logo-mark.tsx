import Image from "next/image";

export function LogoMark({
  size = 44,
  className = ""
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo.png"
      alt="A#100005"
      width={size}
      height={size}
      priority
      className={`rounded-2xl border border-white/60 shadow-sm ${className}`.trim()}
    />
  );
}
