import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Bookmark = {
  id: string;
  target_type: string;
  target_id: string;
  title: string;
  url: string | null;
  created_at: string;
};

export default function Bookmarks() {
  const [items, setItems] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [targetType, setTargetType] = useState("manual");
  const [targetId, setTargetId] = useState("");

  const load = async () => {
    try {
      const { data } = await apiFetch<{ data: Bookmark[] }>("/bookmarks");
      setItems(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!title.trim() || !targetId.trim()) {
      toast.error("Title and Target ID are required");
      return;
    }
    try {
      await apiFetch("/bookmarks", {
        method: "POST",
        body: {
          title,
          url: url || null,
          target_type: targetType,
          target_id: targetId,
        },
      });
      setTitle("");
      setUrl("");
      setTargetId("");
      await load();
      toast.success("Bookmark saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save bookmark");
    }
  };

  const remove = async (id: string) => {
    try {
      await apiFetch(`/bookmarks/${id}`, { method: "DELETE" });
      await load();
    } catch (error) {
      toast.error("Failed to remove bookmark");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h1 className="text-2xl font-display font-bold">Bookmarks</h1>
            <p className="text-sm text-muted-foreground">Save useful pages and resources.</p>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 space-y-3">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            <Label>Target Type</Label>
            <Input value={targetType} onChange={(e) => setTargetType(e.target.value)} />
            <Label>Target ID</Label>
            <Input value={targetId} onChange={(e) => setTargetId(e.target.value)} />
            <Label>URL (optional)</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} />
            <Button onClick={add}>Save Bookmark</Button>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.target_type}:{item.target_id}</p>
                  {item.url && (
                    <a href={item.url} className="text-xs text-primary hover:underline" target="_blank" rel="noreferrer">
                      {item.url}
                    </a>
                  )}
                </div>
                <Button variant="destructive" size="sm" onClick={() => remove(item.id)}>Remove</Button>
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-muted-foreground">No bookmarks yet.</p>}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
