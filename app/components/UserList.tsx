import { Check } from "lucide-react";

interface User {
  id: string;
  name: string;
  avatarUrl: string;
}

interface UserListProps {
  users: User[];
  onUserClick?: (userId: string) => void;
}

export function UserList({ users, onUserClick }: UserListProps) {
  return (
    <div className="flex overflow-x-auto gap-4 py-2 px-1">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex flex-col items-center min-w-20"
          onClick={() => onUserClick?.(user.id)}
        >
          <div className="relative mb-2">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={`${user.name}'s avatar`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-0.5 border-2 border-white">
              <Check size={12} className="text-white" />
            </div>
          </div>
          <span className="text-sm font-medium truncate max-w-20 text-center text-white">
            {user.name}
          </span>
        </div>
      ))}
    </div>
  );
}
