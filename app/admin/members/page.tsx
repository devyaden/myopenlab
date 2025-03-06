"use client";

import { AddMemberModal } from "@/components/admin/add-member-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUsersStore } from "@/lib/store/users";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function MembersPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const {
    users,
    isLoading,
    error,
    totalUsers,
    hasNextPage,
    hasPreviousPage,
    fetchUsers,
    deleteUser,
    updateUserStatus,
  } = useUsersStore();

  useEffect(() => {
    fetchUsers(currentPage, itemsPerPage);
  }, [fetchUsers, currentPage, itemsPerPage]);

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = async (
    id: string,
    currentStatus: boolean | undefined
  ) => {
    try {
      await updateUserStatus(id, !currentStatus);
      toast.success("User status updated successfully");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUser(id);
      toast.success("User deleted successfully");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Error: {error}</p>
        <Button
          onClick={() => fetchUsers(currentPage, itemsPerPage)}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 border h-full rounded-md">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-700" />
          <h1 className="text-xl font-medium">Members</h1>
        </div>
        <Button
          className="bg-yadn-pink hover:bg-yadn-pink/90 text-white"
          onClick={() => setIsAddModalOpen(true)}
        >
          Add New Members
        </Button>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Input
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow className="hover:bg-gray-50">
              <TableHead className="text-xs font-medium text-gray-500 uppercase">
                <div className="flex items-center gap-1">
                  #
                  <ChevronDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase">
                <div className="flex items-center gap-1">
                  Email Address
                  <ChevronDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase">
                <div className="flex items-center gap-1">
                  Role
                  <ChevronDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase">
                <div className="flex items-center gap-1">
                  Application
                  <ChevronDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase">
                <div className="flex items-center gap-1">
                  Last Active
                  <ChevronDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-right text-xs font-medium text-gray-500 uppercase">
                Active
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No members found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user, index) => (
                <TableRow
                  key={user.id}
                  className={
                    index % 2 === 0
                      ? "bg-white hover:bg-gray-50"
                      : "bg-gray-50 hover:bg-gray-100"
                  }
                >
                  <TableCell className="text-sm text-gray-500">
                    {user.id}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="font-mono text-sm text-gray-900">
                      {user.email}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-900">
                    {user.role}
                  </TableCell>
                  <TableCell className="text-sm text-gray-900">
                    {user.application}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {user?.lastActive?.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={() =>
                          handleToggleStatus(user.id, user?.isActive)
                        }
                        className="data-[state=checked]:bg-[#12B76A]"
                      />
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-yadn-primary-red hover:text-yadn-primary-red/90 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-gray-500">
          Showing {users.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}{" "}
          to {Math.min(currentPage * itemsPerPage, totalUsers || 0)} of{" "}
          {totalUsers || 0} members
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={!hasPreviousPage}
            className="p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">Page {currentPage}</div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!hasNextPage}
            className="p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <select
            className="border rounded-md text-sm p-1"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1); // Reset to first page when changing items per page
            }}
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
