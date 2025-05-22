import { UserList } from "./UserList";

export function UserListDemo() {
  // Sample user data
  const users = [
    {
      id: "1",
      name: "Hieu",
      avatarUrl: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Hieu",
    },
    {
      id: "2",
      name: "Alex",
      avatarUrl: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Alex",
    },
    {
      id: "3",
      name: "Maya",
      avatarUrl: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Maya",
    },
    {
      id: "4",
      name: "Sam",
      avatarUrl: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Sam",
    },
    {
      id: "5",
      name: "Jo",
      avatarUrl: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Jo",
    },
  ];

  const handleUserClick = (userId: string) => {
    console.log(`User clicked: ${userId}`);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-3">Users</h2>
      <UserList users={users} onUserClick={handleUserClick} />
    </div>
  );
}
