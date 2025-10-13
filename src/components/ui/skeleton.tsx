import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.ComponentProps<"div"> {}

const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-primary/20",
        className
      )}
      {...props}
    />
  );
};

const SkeletonCard: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg border bg-card border-primary p-6",
        className
      )}
      {...props}
    />
  );
};

const SkeletonButton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-primary/20 h-10 w-24",
        className
      )}
      {...props}
    />
  );
};

const SkeletonInput: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-primary/20 h-10 w-full",
        className
      )}
      {...props}
    />
  );
};

export interface SkeletonTextProps extends React.ComponentProps<"div"> {
  lines?: number;
}

const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 1, className, ...props }) => {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </div>
  );
};

const PageSkeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "min-h-screen bg-background text-foreground",
        className
      )}
      {...props}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="text-center space-y-4">
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>

          {/* Content skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i}>
                <div className="space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <SkeletonText lines={2} />
                  <div className="flex space-x-2">
                    <SkeletonButton />
                    <SkeletonButton />
                  </div>
                </div>
              </SkeletonCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthPageSkeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "min-h-screen bg-white text-black dark:bg-black dark:text-white flex items-center justify-center p-4",
        className
      )}
      {...props}
    >
      <div className="w-full max-w-md">
        <SkeletonCard>
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <SkeletonInput />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <SkeletonInput />
              </div>
            </div>

            {/* Button */}
            <Skeleton className="h-10 w-full" />

            {/* Footer */}
            <div className="text-center">
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
};

const LegalPageSkeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "min-h-screen bg-white text-black dark:bg-black dark:text-white py-8",
        className
      )}
      {...props}
    >
      <div className="max-w-4xl mx-auto px-4">
        <SkeletonCard>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-80" />
              <SkeletonButton />
            </div>

            {/* Content */}
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-1/3" />
                  <SkeletonText lines={3} />
                </div>
              ))}
            </div>
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
};

const HomePageSkeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "min-h-screen bg-white text-black dark:bg-black dark:text-white",
        className
      )}
      {...props}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="text-center mb-8 space-y-4">
          <Skeleton className="h-10 w-80 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto" />
          <div className="flex justify-center space-x-4">
            <SkeletonButton />
            <SkeletonButton />
          </div>
        </div>

        {/* Documents section skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />

          {/* Document cards skeleton */}
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <SkeletonText lines={2} />
                <div className="flex space-x-2">
                  <SkeletonButton />
                  <SkeletonButton />
                </div>
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    </div>
  );
};

const LoginPageSkeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "min-h-screen bg-white text-black dark:bg-black dark:text-white flex items-center justify-center p-4",
        className
      )}
      {...props}
    >
      <div className="w-full max-w-md">
        <SkeletonCard>
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>

            {/* Google button skeleton */}
            <Skeleton className="h-12 w-full" />

            {/* Separator */}
            <div className="relative">
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-4 w-8 mx-auto -mt-2" />
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <SkeletonInput />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <SkeletonInput />
              </div>
            </div>

            {/* Button */}
            <Skeleton className="h-12 w-full" />

            {/* Footer */}
            <div className="text-center">
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
};

const RegisterPageSkeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "min-h-screen bg-white text-black dark:bg-black dark:text-white flex items-center justify-center p-4",
        className
      )}
      {...props}
    >
      <div className="w-full max-w-md">
        <SkeletonCard>
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>

            {/* Google button skeleton */}
            <Skeleton className="h-12 w-full" />

            {/* Separator */}
            <div className="relative">
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-4 w-8 mx-auto -mt-2" />
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              {/* Name fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <SkeletonInput />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <SkeletonInput />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <SkeletonInput />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <SkeletonInput />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <SkeletonInput />
              </div>

              {/* Terms checkbox */}
              <div className="flex items-start space-x-2">
                <Skeleton className="h-4 w-4 mt-1" />
                <SkeletonText lines={2} />
              </div>
            </div>

            {/* Button */}
            <Skeleton className="h-12 w-full" />

            {/* Footer */}
            <div className="text-center">
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
};

const VerifyEmailPageSkeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "min-h-screen bg-white text-black dark:bg-black dark:text-white flex items-center justify-center p-4",
        className
      )}
      {...props}
    >
      <div className="w-full max-w-md">
        <SkeletonCard>
          <div className="text-center space-y-6">
            {/* Icon skeleton */}
            <Skeleton className="h-16 w-16 rounded-full mx-auto" />

            {/* Title and description */}
            <div className="space-y-2">
              <Skeleton className="h-8 w-48 mx-auto" />
              <SkeletonText lines={2} />
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
};

// Profile page skeleton with left-content spacing handled by caller
const ProfilePageSkeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "min-h-screen bg-white text-black dark:bg-black dark:text-white",
        className
      )}
      {...props}
    >
      {/* Cover */}
      <div className="w-full h-40 md:h-52 bg-primary/50 animate-pulse" />

      <div className="max-w-5xl mx-auto px-4 -mt-12 md:-mt-16">
        {/* Avatar + actions */}
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background bg-primary animate-pulse" />

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        {/* Name + meta */}
        <div className="mt-4 space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Notes header */}
        <div className="mt-8">
          <Skeleton className="h-6 w-40" />
        </div>

        {/* Grid */}
        <div className="mt-4 grid gap-4 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i}>
              <div className="space-y-4">
                <Skeleton className="h-5 w-3/4" />
                <SkeletonText lines={3} />
                <div className="flex gap-2">
                  <SkeletonButton />
                  <SkeletonButton />
                </div>
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export {
  Skeleton,
  SkeletonCard,
  SkeletonButton,
  SkeletonInput,
  SkeletonText,
  PageSkeleton,
  AuthPageSkeleton,
  LegalPageSkeleton,
  HomePageSkeleton,
  LoginPageSkeleton,
  RegisterPageSkeleton,
  VerifyEmailPageSkeleton,
  ProfilePageSkeleton,
};
