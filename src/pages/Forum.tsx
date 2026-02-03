import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Search,
  Plus,
  Eye,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  Shield,
  Send,
  X,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ForumPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  is_urgent: boolean;
  status: string;
  views_count: number;
  created_at: string;
  replies_count?: number;
}

interface ForumReply {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_anonymous: boolean;
  is_doctor_reply: boolean;
  created_at: string;
}

const TAGS = [
  "symptoms", "medication", "nutrition", "mental-health", 
  "chronic-illness", "prevention", "emergency", "general"
];

export default function Forum() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isDoctor } = useUserRoles();
  const { toast } = useToast();

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [newPostOpen, setNewPostOpen] = useState(false);

  // New post form
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [isUrgent, setIsUrgent] = useState(false);

  // Reply form
  const [replyContent, setReplyContent] = useState("");
  const [replyAnonymously, setReplyAnonymously] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('forum_replies')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReplies(data || []);
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const handleSelectPost = async (post: ForumPost) => {
    setSelectedPost(post);
    await fetchReplies(post.id);
    
    // Increment view count
    await supabase
      .from('forum_posts')
      .update({ views_count: (post.views_count || 0) + 1 })
      .eq('id', post.id);
  };

  const handleCreatePost = async () => {
    if (!user || !newTitle.trim() || !newContent.trim()) return;

    try {
      const { error } = await supabase.from('forum_posts').insert({
        user_id: user.id,
        title: newTitle,
        content: newContent,
        tags: newTags,
        is_urgent: isUrgent,
      });

      if (error) throw error;

      toast({ title: t.success, description: "Question posted successfully" });
      setNewPostOpen(false);
      setNewTitle("");
      setNewContent("");
      setNewTags([]);
      setIsUrgent(false);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({ title: t.error, variant: "destructive" });
    }
  };

  const handleReply = async () => {
    if (!user || !selectedPost || !replyContent.trim()) return;

    try {
      const { error } = await supabase.from('forum_replies').insert({
        post_id: selectedPost.id,
        user_id: user.id,
        content: replyContent,
        is_anonymous: replyAnonymously,
        is_doctor_reply: isDoctor(),
      });

      if (error) throw error;

      // Update post status if doctor replied
      if (isDoctor()) {
        await supabase
          .from('forum_posts')
          .update({ status: 'answered' })
          .eq('id', selectedPost.id);
      }

      toast({ title: t.success });
      setReplyContent("");
      setReplyAnonymously(false);
      fetchReplies(selectedPost.id);
    } catch (error) {
      console.error('Error creating reply:', error);
      toast({ title: t.error, variant: "destructive" });
    }
  };

  const toggleTag = (tag: string) => {
    setNewTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return 'bg-success/20 text-success';
      case 'flagged': return 'bg-destructive/20 text-destructive';
      default: return 'bg-primary/20 text-primary';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">{t.forumTitle}</h1>
                <p className="text-muted-foreground">{t.askCommunity}</p>
              </div>
            </div>

            {user && (
              <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t.newQuestion}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{t.postQuestion}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>{t.questionTitle}</Label>
                      <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder={t.questionTitle}
                      />
                    </div>
                    <div>
                      <Label>{t.questionDetails}</Label>
                      <Textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder={t.typeSymptoms}
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>{t.selectTags}</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {TAGS.map(tag => (
                          <Badge
                            key={tag}
                            variant={newTags.includes(tag) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isUrgent}
                        onCheckedChange={setIsUrgent}
                      />
                      <Label className="text-destructive flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {t.markAsUrgent}
                      </Label>
                    </div>
                    <Button onClick={handleCreatePost} className="w-full">
                      {t.postQuestion}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <DisclaimerBanner />

          {/* Search */}
          <div className="relative max-w-md mb-6 mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Posts List */}
            <div className="lg:col-span-1 space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">{t.loading}</div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t.noResults}</div>
              ) : (
                filteredPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleSelectPost(post)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedPost?.id === post.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium line-clamp-2">{post.title}</h3>
                      {post.is_urgent && (
                        <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {post.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.views_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge className={getStatusColor(post.status)}>
                        {post.status === 'answered' ? t.answered : t.open}
                      </Badge>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Post Detail */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {selectedPost ? (
                  <motion.div
                    key={selectedPost.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-card rounded-xl border border-border p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {selectedPost.is_urgent && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Urgent
                            </Badge>
                          )}
                          <Badge className={getStatusColor(selectedPost.status)}>
                            {selectedPost.status === 'answered' ? t.answered : t.open}
                          </Badge>
                        </div>
                        <h2 className="text-xl font-display font-bold">{selectedPost.title}</h2>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedPost(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <p className="text-muted-foreground mb-4">{selectedPost.content}</p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {selectedPost.tags.map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>

                    {selectedPost.is_urgent && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                        <p className="text-sm text-destructive flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          {t.seekProfessionalHelp}
                        </p>
                      </div>
                    )}

                    {/* Replies */}
                    <div className="border-t border-border pt-6">
                      <h3 className="font-medium mb-4">{t.replies} ({replies.length})</h3>
                      
                      <div className="space-y-4 mb-6">
                        {replies.map((reply) => (
                          <div
                            key={reply.id}
                            className={`p-4 rounded-lg ${
                              reply.is_doctor_reply
                                ? 'bg-primary/10 border border-primary/20'
                                : 'bg-muted'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {reply.is_doctor_reply ? (
                                <Badge className="gap-1 bg-primary">
                                  <Shield className="w-3 h-3" />
                                  {t.doctorAnswer}
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <User className="w-3 h-3 mr-1" />
                                  {reply.is_anonymous ? 'Anonymous' : 'User'}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(reply.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm">{reply.content}</p>
                          </div>
                        ))}
                      </div>

                      {/* Reply Form */}
                      {user && (
                        <div className="space-y-3">
                          <Textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={t.writeReply}
                            rows={3}
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={replyAnonymously}
                                onCheckedChange={setReplyAnonymously}
                              />
                              <Label className="text-sm">{t.replyAnonymously}</Label>
                            </div>
                            <Button onClick={handleReply} className="gap-2">
                              <Send className="w-4 h-4" />
                              {t.reply}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-card rounded-xl border border-border p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Select a question to view details
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
