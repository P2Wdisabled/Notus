import React from "react";

interface NotificationItemProps {
    avatar?: string | null;
    username: string;
    id_sender?: number | null;
    message: string;
    onClick?: () => void;
}

export default function NotificationItem({
    avatar,
    username,
    id_sender,
    message,
    onClick,
}: NotificationItemProps) {
    const isSystem = typeof id_sender !== "undefined"
        ? id_sender === null
        : (username || "").toLowerCase() === "system" || avatar === "system";

    const normalizedAvatar = typeof avatar === "string" ? avatar.trim() : "";
    const hasAvatar = !!normalizedAvatar && normalizedAvatar !== "null" && normalizedAvatar !== "undefined";

    const [imgError, setImgError] = React.useState(false);

    React.useEffect(() => {
        setImgError(false);
    }, [normalizedAvatar]);

    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full flex flex-row items-center text-left px-3 py-2 rounded hover:bg-muted text-foreground"
        >
            {!isSystem ? (
                hasAvatar && !imgError ? (
                    <img
                        src={normalizedAvatar}
                        alt={username || "avatar"}
                        className="w-8 h-8 rounded-full mr-3 object-cover"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full mr-3 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    </div>
                )
            ) : null}

            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{isSystem ? "Système" : username || "Utilisateur"}</span>
                    {normalizedAvatar ? (
                        <span
                            className="text-xs text-muted-foreground ml-1 cursor-pointer select-none"
                            title={normalizedAvatar.slice(0, 200)}
                            onClick={(e) => {
                                e.stopPropagation();
                                try { navigator.clipboard.writeText(normalizedAvatar); } catch (err) { }
                            }}
                        >
                            {`len:${normalizedAvatar.length}${normalizedAvatar.startsWith("data:") ? " • data" : ""}`}
                        </span>
                    ) : null}
                </div>
                <span className="text-sm text-muted-foreground truncate max-w-[260px]" title={message || ""}>
                    {message || ""}
                </span>
            </div>
        </button>
    );
}