import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Users,
  MessageSquare,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Flag,
  TrendingUp,
  MapPin,
  Pill,
  CircleQuestionMark,
  MessageCircle,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/useLanguage";
import { useAuth } from "@/contexts/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { apiFetch } from "@/lib/api";
import { Navigate } from "react-router-dom";

interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  flaggedPosts: number;
  pendingArticles: number;
}

interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: unknown;
  created_at: string;
}

interface FlaggedPost {
  id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
}

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  banned: boolean;
  created_at: string;
}

interface AnalyticsTopic {
  label: string;
  mentions: number;
}

interface AnalyticsContributor {
  userId: string;
  displayName: string;
  postCount: number;
  flaggedCount: number;
}

interface AnalyticsForumData {
  totalPosts: number;
  visiblePosts: number;
  hiddenPosts: number;
  statusBreakdown: Record<string, number>;
  trendingTopics: AnalyticsTopic[];
  popularTags: AnalyticsTopic[];
  topContributors: AnalyticsContributor[];
  mostPopularQuestion: AnalyticsQuestion | null;
}

interface AnalyticsAiData {
  evaluationCount: number;
  averages: {
    urgency: number;
    safety: number;
    handling: number;
    consistency: number;
  };
  commonKeywords: AnalyticsTopic[];
}

interface AnalyticsQuestion {
  id: string;
  title: string;
  views: number;
  replies: number;
}

interface AnalyticsAiChatData {
  sessionCount: number;
  topQueries: AnalyticsTopic[];
  commonKeywords: AnalyticsTopic[];
}

interface AnalyticsMedicineData {
  totalMedicines: number;
  uniqueUsers: number;
  averagePerUser: number;
  topMedicines: AnalyticsTopic[];
}

interface AnalyticsPayload {
  timestamp: string;
  forum: AnalyticsForumData;
  aiConsultant: AnalyticsAiData;
  medicineCabinet: AnalyticsMedicineData;
  aiChat: AnalyticsAiChatData;
}

export default function AdminPanel() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const isAdminRole = isAdmin();

  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalPosts: 0,
    flaggedPosts: 0,
    pendingArticles: 0,
  });
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || rolesLoading || !isAdminRole) {
      return;
    }
    fetchStats();
    fetchLogs();
    fetchFlaggedPosts();
    fetchUsers();
    fetchAnalytics();
  }, [user, rolesLoading, isAdminRole]);

  const fetchStats = async () => {
    try {
      const { stats } = await apiFetch<{ stats: AdminStats }>("/admin/stats");
      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data } = await apiFetch<{ data: AdminLog[] }>("/admin/logs");
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const fetchFlaggedPosts = async () => {
    try {
      const { data } = await apiFetch<{ data: FlaggedPost[] }>("/forum/moderation/pending");
      const pending = (data || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setFlaggedPosts(pending);
    } catch (error) {
      console.error('Error fetching flagged posts:', error);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { data } = await apiFetch<{ data: AdminUser[] }>("/admin/users");
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const { data } = await apiFetch<{ data: AnalyticsPayload }>("/admin/analytics");
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalyticsError(t.error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleToggleBan = async (target: AdminUser) => {
    const action = target.banned ? "unban" : "ban";
    try {
      await apiFetch(`/admin/users/${target.id}/${action}`, {
        method: "POST",
      });
      toast({
        title: t.success,
        description: target.banned ? t.userUnbanned : t.userBanned,
      });
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Error updating user ban status:', error);
      toast({ title: t.error, variant: "destructive" });
    }
  };

  const handleModeratePost = async (postId: string, decision: "approve" | "reject") => {
    try {
      await apiFetch(`/forum/posts/${postId}/moderation`, {
        method: "PATCH",
        body: { decision },
      });

      await apiFetch("/admin/logs", {
        method: "POST",
        body: {
          action: `Moderator ${decision}d post`,
          target_type: "forum_post",
          target_id: postId,
          details: null,
        },
      });

      fetchFlaggedPosts();
      fetchStats();
      fetchAnalytics();
    } catch (error) {
      console.error('Error moderating post:', error);
    }
  };

  // Access control
  if (rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">{t.loading}</div>
      </div>
    );
  }

  if (!user || !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">{t.adminPanel}</h1>
              <p className="text-muted-foreground">{t.dashboard}</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border p-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">{t.totalUsers}</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl border border-border p-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="w-5 h-5 text-secondary" />
                <span className="text-sm text-muted-foreground">Forum Posts</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalPosts}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-xl border border-border p-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="text-sm text-muted-foreground">{t.flaggedContent}</span>
              </div>
              <p className="text-2xl font-bold">{stats.flaggedPosts}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl border border-border p-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <Eye className="w-5 h-5 text-warning" />
                <span className="text-sm text-muted-foreground">{t.pendingReviews}</span>
              </div>
              <p className="text-2xl font-bold">{stats.pendingArticles}</p>
            </motion.div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="moderation">
            <TabsList className="mb-6">
              <TabsTrigger value="moderation" className="gap-2">
                <Flag className="w-4 h-4" />
                {t.contentModeration}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                {t.analytics}
              </TabsTrigger>
              <TabsTrigger value="logs" className="gap-2">
                <Clock className="w-4 h-4" />
                {t.activityLogs}
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                {t.userManagement}
              </TabsTrigger>
            </TabsList>

            {/* Content Moderation */}
            <TabsContent value="moderation">
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-medium mb-4">{t.flaggedContent}</h3>
                {flaggedPosts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success" />
                    <p>No flagged content to review</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {flaggedPosts.map((post) => (
                      <div
                        key={post.id}
                        className="p-4 rounded-lg border border-destructive/20 bg-destructive/5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{post.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {post.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(post.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleModeratePost(post.id, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleModeratePost(post.id, 'reject')}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Analytics (Aggregated Only) */}
            <TabsContent value="analytics">
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h3 className="font-medium">{t.aggregatedData}</h3>
                </div>

                {analyticsLoading ? (
                  <div className="text-center py-10 text-muted-foreground">{t.loading}</div>
                ) : analyticsError ? (
                  <p className="text-sm text-center text-destructive">{analyticsError}</p>
                ) : analytics ? (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <h4 className="font-medium">{t.trendingTopics}</h4>
                        </div>
                        <div className="space-y-2">
                          {analytics.forum.trendingTopics.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No significant trends yet.</p>
                          ) : (
                            analytics.forum.trendingTopics.map((topic) => (
                              <div key={topic.label} className="flex items-center justify-between">
                                <span className="text-sm capitalize">{topic.label}</span>
                                <Badge variant="secondary">{topic.mentions} mentions</Badge>
                              </div>
                            ))
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                          {analytics.forum.visiblePosts} visible posts · {analytics.forum.hiddenPosts} awaiting moderation
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="w-4 h-4 text-primary" />
                          <h4 className="font-medium">{t.popularTags}</h4>
                        </div>
                        <div className="space-y-2">
                          {analytics.forum.popularTags.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Tags will appear once users add them.</p>
                          ) : (
                            analytics.forum.popularTags.map((tag) => (
                              <div key={tag.label} className="flex items-center justify-between">
                                <span className="text-sm lowercase">{tag.label}</span>
                                <Badge variant="secondary">{tag.mentions} mentions</Badge>
                              </div>
                            ))
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                          {Object.entries(analytics.forum.statusBreakdown)
                            .map(([status, count]) => `${status}: ${count}`)
                            .join(" · ")}
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-2 mb-3">
                          <CircleQuestionMark className="w-4 h-4 text-primary" />
                          <h4 className="font-medium">{t.mostPopularQuestion}</h4>
                        </div>
                        {analytics.forum.mostPopularQuestion ? (
                          <>
                            <p className="text-sm font-medium">{analytics.forum.mostPopularQuestion.title}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {t.questionViews}: {analytics.forum.mostPopularQuestion.views} · {t.questionReplies}: {analytics.forum.mostPopularQuestion.replies}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">No questions yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4 text-primary" />
                          <h4 className="font-medium">{t.topContributors}</h4>
                        </div>
                        <div className="space-y-3">
                          {analytics.forum.topContributors.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No contributors yet.</p>
                          ) : (
                            analytics.forum.topContributors.map((contributor) => (
                              <div key={contributor.userId} className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">{contributor.displayName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {contributor.postCount} posts · {contributor.flaggedCount} flagged
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className="w-4 h-4 text-primary" />
                          <h4 className="font-medium">{t.aiConsultantMetrics}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t.evaluationCount}: {analytics.aiConsultant.evaluationCount}
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-muted-foreground">
                          <div>
                            <p className="font-semibold text-sm">Urgency</p>
                            <p>{analytics.aiConsultant.averages.urgency}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Safety</p>
                            <p>{analytics.aiConsultant.averages.safety}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Handling</p>
                            <p>{analytics.aiConsultant.averages.handling}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Consistency</p>
                            <p>{analytics.aiConsultant.averages.consistency}</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-xs text-muted-foreground mb-2">{t.commonKeywords}</p>
                          <div className="flex flex-wrap gap-2">
                            {analytics.aiConsultant.commonKeywords.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No keywords yet.</p>
                            ) : (
                              analytics.aiConsultant.commonKeywords.map((keyword) => (
                                <Badge key={keyword.label} variant="outline">
                                  {keyword.label}: {keyword.mentions}
                                </Badge>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageCircle className="w-4 h-4 text-primary" />
                          <h4 className="font-medium">{t.aiChatSessions}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {analytics.aiChat.sessionCount} sessions recorded
                        </p>
                        <div className="space-y-2 mt-4">
                          <p className="text-xs text-muted-foreground">{t.aiChatTopQueries}</p>
                          <div className="flex flex-wrap gap-2">
                            {analytics.aiChat.topQueries.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No chat queries yet.</p>
                            ) : (
                              analytics.aiChat.topQueries.map((query) => (
                                <Badge key={query.label} variant="outline">
                                  {query.label}: {query.mentions}
                                </Badge>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground">{t.aiChatKeywords}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {analytics.aiChat.commonKeywords.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No keywords yet.</p>
                            ) : (
                              analytics.aiChat.commonKeywords.map((keyword) => (
                                <Badge key={keyword.label} variant="secondary">
                                  {keyword.label}: {keyword.mentions}
                                </Badge>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-2 mb-3">
                          <Pill className="w-4 h-4 text-primary" />
                          <h4 className="font-medium">{t.medicineCabinetMetrics}</h4>
                        </div>
                        <div className="grid md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">{t.totalMedicines}</p>
                            <p className="text-xl font-semibold">{analytics.medicineCabinet.totalMedicines}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{t.uniqueUsers}</p>
                            <p className="text-xl font-semibold">{analytics.medicineCabinet.uniqueUsers}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{t.averagePerUser}</p>
                            <p className="text-xl font-semibold">{analytics.medicineCabinet.averagePerUser}</p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <p className="text-xs text-muted-foreground">{t.topMedicines}</p>
                          <div className="flex flex-wrap gap-2">
                            {analytics.medicineCabinet.topMedicines.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No medicines tracked yet.</p>
                            ) : (
                              analytics.medicineCabinet.topMedicines.map((med) => (
                                <Badge key={med.label} variant="secondary">
                                  {med.label}: {med.mentions}
                                </Badge>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {t.lastUpdated}: {new Date(analytics.timestamp).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">No analytics available.</p>
                )}

                <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <strong>Privacy Notice:</strong> All analytics data is anonymized using k-anonymity thresholds. 
                    No individual user data is visible. Timestamps are rounded, and rare events are filtered out.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Activity Logs */}
            <TabsContent value="logs">
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-medium mb-4">{t.activityLogs}</h3>
                {logs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No activity logs yet</p>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted"
                      >
                        <div>
                          <p className="text-sm font-medium">{log.action}</p>
                          {log.target_type && (
                            <p className="text-xs text-muted-foreground">
                              {log.target_type}: {log.target_id?.slice(0, 8)}...
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="users">
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">{t.users}</h3>
                  <Badge variant="outline">{t.accountStatus}</Badge>
                </div>
                {usersLoading ? (
                  <div className="text-center py-8 text-muted-foreground">{t.loading}</div>
                ) : users.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">{t.noResults}</p>
                ) : (
                  <div className="space-y-3">
                    {users.map((usr) => (
                      <div
                        key={usr.id}
                        className="p-4 rounded-xl border border-border bg-muted/40"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium">{usr.displayName || usr.email}</p>
                            <p className="text-xs text-muted-foreground">{usr.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(usr.created_at).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant={usr.banned ? "destructive" : "secondary"}>
                            {usr.banned ? t.banned : t.active}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                          <span>{usr.roles.join(", ")}</span>
                          <Button
                            variant={usr.banned ? "secondary" : "destructive"}
                            size="sm"
                            onClick={() => handleToggleBan(usr)}
                          >
                            {usr.banned ? t.unbanUser : t.banUser}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}


