import Image from 'next/image';

type Props = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function Logo({ size = 28, className = '', priority = false }: Props) {
  return (
    <Image
      src="/routrip.png"
      alt="routrip"
      width={size}
      height={size}
      priority={priority}
      className={`rounded-lg ${className}`}
    />
  );
}
