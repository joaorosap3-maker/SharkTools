import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../components/AuthProvider";

export const useNotifications = () => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", companyId],
    queryFn: async () => {
      if (!companyId) throw new Error("Company ID not found");
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", companyId] });
    },
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return { notifications, isLoading, unreadCount, markAsRead };
};

export const createNotification = async (companyId: string, title: string, description: string, link?: string) => {
  const { error } = await supabase
    .from("notifications")
    .insert([{ company_id: companyId, title, description, link }]);
  if (error) console.error("Error creating notification:", error);
};
