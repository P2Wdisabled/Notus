// Export all UI components from a single file for easier imports
export { Button, buttonVariants } from "./button";
export type { ButtonProps } from "./button";

export { Input } from "./input";
export type { InputProps } from "./input";

export { Textarea } from "./textarea";
export type { TextareaProps } from "./textarea";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "./card";
export type { CardProps } from "./card";

export { default as Alert, AlertTitle, AlertDescription, alertVariants } from "./alert";
export type { AlertProps } from "./alert";

export { default as LoadingSpinner, LoadingPage, LoadingCard } from "./loading-spinner";
export type { LoadingSpinnerProps, LoadingPageProps } from "./loading-spinner";

export { default as Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter } from "./modal";
export type { ModalProps } from "./modal";

export { Badge, badgeVariants } from "./badge";
export type { BadgeProps } from "./badge";

export { default as Form, FormGroup, FormLabel, FormError, FormHelperText, FormActions } from "./form";
export type { FormProps, FormLabelProps } from "./form";

export { default as Logo } from "./logo";
export type { LogoProps } from "./logo";

export { default as ImageUpload } from "./image-upload";
export type { ImageUploadProps } from "./image-upload";

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
} from "./skeleton";
export type { SkeletonProps, SkeletonTextProps } from "./skeleton";

// Re-export shadcn/ui components for convenience
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

export { Avatar, AvatarImage, AvatarFallback } from "./avatar";

export { Separator } from "./separator";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./select";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "./dropdown-menu";

export { ScrollArea, ScrollBar } from "./scroll-area";

