import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bookmark, FileText, MessageSquare, ExternalLink, Trash2 } from "lucide-react";

type BookmarkItem = {
  id: string;
  target_type: string;
  target_id: string;
  title: string;
  url: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

type FilterType = "all" | "ai_chat" | "article";

export default function Bookmarks() {
  const navigate = useNavigate();
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await apiFetch<{ data: BookmarkItem[] }>("/bookmarks");
      setItems(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load bookmarks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items;
    return items.filter((item) => item.target_type === activeFilter);
  }, [activeFilter, items]);

  const openBookmark = (item: BookmarkItem) => {
    if (item.target_type === "ai_chat") {
      navigate(`/consultant?session=${item.target_id}`);
      return;
    }
    if (item.target_type === "article") {
      navigate(`/articles?article=${item.target_id}`);
      return;
    }
    if (item.url) {
      if (item.url.startsWith("/")) {
        navigate(item.url);
      } else {
        window.open(item.url, "_blank", "noopener,noreferrer");
      }
      return;
    }
    toast.error("Cannot open this bookmark");
  };

  const removeBookmark = async (id: string) => {
    setRemovingId(id);
    try {
      await apiFetch(`/bookmarks/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Removed from bookmarks");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove bookmark");
    } finally {
      setRemovingId(null);
    }
  };

  const getTypeLabel = (type: string) => {
    if (type === "ai_chat") return "AI Chat";
    if (type === "article") return "Article";
    return "Other";
  };

  const getTypeIcon = (type: string) => {
    if (type === "ai_chat") return <MessageSquare className="w-4 h-4" />;
    if (type === "article") return <FileText className="w-4 h-4" />;
    return <Bookmark className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h1 className="text-2xl font-display font-bold">Saved Items</h1>
            <p className="text-sm text-muted-foreground">
              Keep important AI chats and articles here for quick access.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={activeFilter === "all" ? "default" : "outline"} onClick={() => setActiveFilter("all")}>
              All
            </Button>
            <Button size="sm" variant={activeFilter === "ai_chat" ? "default" : "outline"} onClick={() => setActiveFilter("ai_chat")}>
              AI Chats
            </Button>
            <Button size="sm" variant={activeFilter === "article" ? "default" : "outline"} onClick={() => setActiveFilter("article")}>
              Articles
            </Button>
          </div>

          <div className="space-y-3">
            {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}

            {!loading &&
              filteredItems.map((item) => (
                <div key={item.id} className="bg-card rounded-xl border border-border p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(item.target_type)}
                      <Badge variant="outline">{getTypeLabel(item.target_type)}</Badge>
                    </div>
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Saved: {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => openBookmark(item)}>
                      <ExternalLink className="w-3 h-3" />
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1"
                      disabled={removingId === item.id}
                      onClick={() => removeBookmark(item.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

            {!loading && filteredItems.length === 0 && (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <Bookmark className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No saved items yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
