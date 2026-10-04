import agendivoIsotipoColor from "@/assets/brand/agendivo-isotipo-color.svg";
import agendivoIsotipoNegative from "@/assets/brand/agendivo-isotipo-negative.svg";
import agendivoLogoHorizontalColor from "@/assets/brand/agendivo-logo-horizontal-color.svg";
import agendivoLogoHorizontalNegative from "@/assets/brand/agendivo-logo-horizontal-negative.svg";
import { cn } from "@/lib/utils";

const BRAND_ASSET = {
  "isotipo-color": agendivoIsotipoColor,
  "isotipo-negative": agendivoIsotipoNegative,
  "logo-horizontal-color": agendivoLogoHorizontalColor,
  "logo-horizontal-negative": agendivoLogoHorizontalNegative,
} as const;

type AgendivoBrandVariant = keyof typeof BRAND_ASSET;

interface AgendivoBrandProps {
  alt?: string;
  className?: string;
  variant: AgendivoBrandVariant;
}

export function AgendivoBrand({
  alt = "",
  className,
  variant,
}: AgendivoBrandProps) {
  return (
    <img
      alt={alt}
      className={cn("block shrink-0 select-none", className)}
      draggable={false}
      src={BRAND_ASSET[variant]}
    />
  );
}
