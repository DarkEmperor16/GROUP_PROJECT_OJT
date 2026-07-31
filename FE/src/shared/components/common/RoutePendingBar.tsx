import { useNavigation } from "react-router-dom";
import { cn } from "@/lib/utils";

/** Thin progress bar during route transitions — instant feedback without waiting for chunks. */
export default function RoutePendingBar() {
  const navigation = useNavigation();
  const isPending = navigation.state === "loading";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden",
        isPending ? "opacity-100" : "opacity-0",
      )}
      aria-hidden={!isPending}
    >
      <div
        className={cn(
          "h-full w-1/3 bg-primary",
          isPending && "animate-[route-pending_0.9s_ease-in-out_infinite]",
        )}
      />
    </div>
  );
}
