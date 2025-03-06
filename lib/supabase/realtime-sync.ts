import type { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "react-hot-toast";
import { createClient } from "./client";

interface SyncCallbacks {
  onCanvasUpdate?: (data: any) => void;
  onFolderUpdate?: (data: any) => void;
  onError?: (error: any) => void;
}

const supabase = createClient();

export class RealtimeSync {
  private channel: RealtimeChannel | null = null;
  private callbacks: SyncCallbacks = {};

  constructor(callbacks: SyncCallbacks = {}) {
    this.callbacks = callbacks;
  }

  subscribe(canvasId: string) {
    // Unsubscribe from any existing channel
    this.unsubscribe();

    // Subscribe to canvas changes
    this.channel = supabase
      .channel(`canvas:${canvasId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "canvases",
          filter: `id=eq.${canvasId}`,
        },
        (payload) => {
          console.log("Canvas changed:", payload);
          if (this.callbacks.onCanvasUpdate) {
            this.callbacks.onCanvasUpdate(payload.new);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "canvas_data",
          filter: `canvas_id=eq.${canvasId}`,
        },
        (payload) => {
          console.log("Canvas data changed:", payload);
          if (this.callbacks.onCanvasUpdate) {
            this.callbacks.onCanvasUpdate(payload.new);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Subscribed to canvas changes");
        } else if (status === "CLOSED") {
          console.log("Subscription closed");
          if (this.callbacks.onError) {
            this.callbacks.onError(new Error("Subscription closed"));
          }
        } else if (status === "CHANNEL_ERROR") {
          console.error("Channel error");
          if (this.callbacks.onError) {
            this.callbacks.onError(new Error("Channel error"));
          }
          toast.error("Lost connection to server. Trying to reconnect...");
        }
      });

    return this;
  }

  subscribeToFolder(folderId: string) {
    // Subscribe to folder changes
    this.channel = supabase
      .channel(`folder:${folderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "folders",
          filter: `id=eq.${folderId}`,
        },
        (payload) => {
          console.log("Folder changed:", payload);
          if (this.callbacks.onFolderUpdate) {
            this.callbacks.onFolderUpdate(payload.new);
          }
        }
      )
      .subscribe();

    return this;
  }

  unsubscribe() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
  }

  async syncCanvasData(canvasId: string, data: any) {
    try {
      const { error } = await supabase.from("canvas_data").upsert({
        canvas_id: canvasId,
        nodes: data.nodes,
        edges: data.edges,
        styles: data.nodeStyles,
        version: data.version || 1,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error syncing canvas data:", error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      toast.error("Failed to sync changes");
    }
  }

  async syncCanvasSettings(canvasId: string, settings: any) {
    try {
      const { error } = await supabase.from("canvas_settings").upsert({
        canvas_id: canvasId,
        ...settings,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error syncing canvas settings:", error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      toast.error("Failed to sync settings");
    }
  }
}

// Create a singleton instance
export const realtimeSync = new RealtimeSync();
