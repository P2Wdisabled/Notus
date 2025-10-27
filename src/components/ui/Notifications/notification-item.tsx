import React from "react";

interface NotificationItemProps {
    avatar: string;
    username: string;
    message: string;
    onClick: () => void;
}

export default function NotificationItem({
    avatar,
    username,
    message,
    onClick,
}: NotificationItemProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full flex flex-row items-center text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white"
        >
            {avatar ? (
                <img src={avatar} alt={username || "avatar"} className="w-8 h-8 rounded-full mr-3 object-cover" />
            ) : (
                <div className="w-8 h-8 rounded-full mr-3 bg-gray-200 dark:bg-gray-700" />
            )}

            <div className="flex flex-col">
                <span className="font-medium text-sm">{username || "Utilisateur"}</span>
                <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[260px]">{message || ""}</span>
            </div>
        </button>
    );
}