"use client"; 

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface User {
  id: string;
  primaryEmail: string | null;
  displayName: string | null;
  signedUpAt: Date;
}

async function handleDelete(userId: string) {
  // Make an API call to delete the user
  const res = await fetch(`/api/users/delete/${userId}`, {
    method: "DELETE",
  });

  if (res.ok) {
    alert("User deleted successfully");
    // Optionally trigger a refresh or refetch the user list
  } else {
    alert("Failed to delete user");
  }
}

async function handleBlock(userId: string) {
  // Make an API call to block the user
  const res = await fetch(`/api/users/block/${userId}`, {
    method: "POST",
  });

  if (res.ok) {
    alert("User blocked successfully");
    // Optionally trigger a refresh or refetch the user list
  } else {
    alert("Failed to block user");
  }
}

export default function ClientUserTable({ users }: { users: User[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Display Name</TableHead>
          <TableHead>Signed Up</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.primaryEmail}</TableCell>
            <TableCell>{user.displayName}</TableCell>
            <TableCell>{new Date(user.signedUpAt).toLocaleString()}</TableCell>
            <TableCell>
              <button
                onClick={() => handleDelete(user.id)}
                className="text-red-500 mr-4"
              >
                Delete
              </button>
              <button
                onClick={() => handleBlock(user.id)}
                className="text-blue-500"
              >
                Block
              </button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
