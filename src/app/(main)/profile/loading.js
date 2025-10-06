import { ProfilePageSkeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Keep left navbar space consistent on md+ */}
      <div className="md:ml-64">
        <ProfilePageSkeleton />
      </div>
    </div>
  );
}

