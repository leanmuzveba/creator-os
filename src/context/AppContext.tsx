import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PostItem, SocialAccount, TrendItem, ViewTab, ContentCategory, PlatformType } from '../types';

interface AppContextType {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  posts: PostItem[];
  socialAccounts: SocialAccount[];
  trends: TrendItem[];
  isLoading: boolean;
  
  // Modals & Active items
  previewPost: PostItem | null;
  setPreviewPost: (post: PostItem | null) => void;
  
  isScheduleModalOpen: boolean;
  setIsScheduleModalOpen: (open: boolean) => void;
  scheduleModalInitialData: Partial<PostItem> | null;
  openScheduleModalWithData: (data?: Partial<PostItem>) => void;
  
  selectedTrend: TrendItem | null;
  setSelectedTrend: (trend: TrendItem | null) => void;
  
  isAccountsModalOpen: boolean;
  setIsAccountsModalOpen: (open: boolean) => void;

  // Actions
  refreshAccounts: () => Promise<void>;
  updateAccount: (id: PlatformType, updates: Partial<SocialAccount>) => Promise<void>;
  addPost: (post: Omit<PostItem, 'id'>) => Promise<PostItem>;
  updatePost: (id: string, updates: Partial<PostItem>) => Promise<PostItem>;
  deletePost: (id: string) => Promise<void>;
  publishPostNow: (id: string) => Promise<void>;
  toggleAccountConnection: (id: PlatformType) => Promise<void>;
  
  // AI Tab Bridge
  aiInitialPrompt: string;
  aiInitialCategory: ContentCategory;
  aiInitialTab: 'ideas' | 'hooks' | 'scripts' | 'shotlist';
  navigateToAiWith: (prompt: string, category?: ContentCategory, subTab?: 'ideas' | 'hooks' | 'scripts' | 'shotlist') => void;

  // Notifications
  toast: { message: string; type: 'success' | 'info' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;

  // Viewport mode
  isMobileDeviceView: boolean;
  setIsMobileDeviceView: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [previewPost, setPreviewPost] = useState<PostItem | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleModalInitialData, setScheduleModalInitialData] = useState<Partial<PostItem> | null>(null);

  const [selectedTrend, setSelectedTrend] = useState<TrendItem | null>(null);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);

  const [aiInitialPrompt, setAiInitialPrompt] = useState('');
  const [aiInitialCategory, setAiInitialCategory] = useState<ContentCategory>('Free Tech Resources');
  const [aiInitialTab, setAiInitialTab] = useState<'ideas' | 'hooks' | 'scripts' | 'shotlist'>('ideas');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isMobileDeviceView, setIsMobileDeviceView] = useState(false);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const openScheduleModalWithData = (data?: Partial<PostItem>) => {
    setScheduleModalInitialData(data || null);
    setIsScheduleModalOpen(true);
  };

  const navigateToAiWith = (
    prompt: string,
    category: ContentCategory = 'Free Tech Resources',
    subTab: 'ideas' | 'hooks' | 'scripts' | 'shotlist' = 'ideas'
  ) => {
    setAiInitialPrompt(prompt);
    setAiInitialCategory(category);
    setAiInitialTab(subTab);
    setActiveTab('ai');
  };

  // Initial Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsRes, accountsRes, trendsRes] = await Promise.all([
          fetch('/api/posts'),
          fetch('/api/accounts'),
          fetch('/api/trends'),
        ]);

        if (postsRes.ok) {
          const p = await postsRes.json();
          setPosts(p);
        }
        if (accountsRes.ok) {
          const a = await accountsRes.json();
          setSocialAccounts(a);
        }
        if (trendsRes.ok) {
          const t = await trendsRes.json();
          setTrends(t);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const refreshAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const a = await res.json();
        setSocialAccounts(a);
      }
    } catch (err) {
      console.error('Failed to refresh accounts:', err);
    }
  };

  // Listen for OAuth popup completion messages
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        refreshAccounts();
        showToast(
          `Successfully connected ${event.data.platform?.toUpperCase() || 'Account'} (${event.data.handle || 'Verified'})! 🎉`,
          'success'
        );
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        showToast(`OAuth Error: ${event.data.error || 'Authorization failed'}`, 'error');
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // Helper for resilient JSON response parsing
  const handleJsonResponse = async <T,>(res: Response, defaultMessage: string): Promise<T> => {
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      if (!res.ok) {
        throw new Error(text && text.length < 150 && !text.startsWith('<') ? text : `${defaultMessage} (${res.status})`);
      }
    }
    if (!res.ok) {
      throw new Error(data?.error || `${defaultMessage} (${res.status})`);
    }
    return data as T;
  };

  const addPost = async (postData: Omit<PostItem, 'id'>): Promise<PostItem> => {
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      const newPost = await handleJsonResponse<PostItem>(res, 'Failed to create post');
      setPosts((prev) => [newPost, ...prev]);
      showToast(`Post "${newPost.title}" created successfully!`, 'success');
      return newPost;
    } catch (err: any) {
      console.error('addPost error:', err);
      showToast(err.message || 'Failed to create post', 'error');
      throw err;
    }
  };

  const updatePost = async (id: string, updates: Partial<PostItem>): Promise<PostItem> => {
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updated = await handleJsonResponse<PostItem>(res, 'Failed to update post');
      setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      if (previewPost && previewPost.id === id) {
        setPreviewPost(updated);
      }
      showToast('Post updated successfully', 'success');
      return updated;
    } catch (err: any) {
      console.error('updatePost error:', err);
      showToast(err.message || 'Failed to update post', 'error');
      throw err;
    }
  };

  const deletePost = async (id: string): Promise<void> => {
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      await handleJsonResponse<{ success: boolean }>(res, 'Failed to delete post');
      setPosts((prev) => prev.filter((p) => p.id !== id));
      if (previewPost?.id === id) {
        setPreviewPost(null);
      }
      showToast('Post deleted', 'info');
    } catch (err: any) {
      console.error('deletePost error:', err);
      showToast(err.message || 'Failed to delete post', 'error');
      throw err;
    }
  };

  const publishPostNow = async (id: string): Promise<void> => {
    try {
      const target = posts.find((p) => p.id === id);
      if (!target) return;
      const updated = await updatePost(id, {
        status: 'published',
        publishedDate: new Date().toISOString().split('T')[0],
        views: Math.floor(Math.random() * 20000) + 1000,
        likes: Math.floor(Math.random() * 2000) + 100,
        comments: Math.floor(Math.random() * 100) + 10,
        shares: Math.floor(Math.random() * 80) + 5,
        bookmarks: Math.floor(Math.random() * 250) + 20,
      });
      if (previewPost && previewPost.id === id) {
        setPreviewPost(updated);
      }
      showToast(`Published to ${target.platforms.map((p) => p.toUpperCase()).join(', ')}! 🚀`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to publish post', 'error');
    }
  };

  const updateAccount = async (id: PlatformType, updates: Partial<SocialAccount>): Promise<void> => {
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updated = await handleJsonResponse<SocialAccount>(res, 'Failed to update account metrics');
      setSocialAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast(`${updated.name} profile and metrics updated!`, 'success');
    } catch (err: any) {
      console.error('updateAccount error:', err);
      showToast(err.message || 'Failed to update account metrics', 'error');
    }
  };

  const toggleAccountConnection = async (id: PlatformType): Promise<void> => {
    try {
      const res = await fetch(`/api/accounts/${id}/toggle`, { method: 'POST' });
      const updated = await handleJsonResponse<SocialAccount>(res, 'Account sync failed');
      setSocialAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast(
        `${updated.name} ${updated.connected ? 'connected' : 'disconnected'} successfully`,
        updated.connected ? 'success' : 'info'
      );
    } catch (err: any) {
      console.error('toggleAccountConnection error:', err);
      showToast(err.message || 'Account sync failed', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        posts,
        socialAccounts,
        trends,
        isLoading,
        previewPost,
        setPreviewPost,
        isScheduleModalOpen,
        setIsScheduleModalOpen,
        scheduleModalInitialData,
        openScheduleModalWithData,
        selectedTrend,
        setSelectedTrend,
        isAccountsModalOpen,
        setIsAccountsModalOpen,
        refreshAccounts,
        updateAccount,
        addPost,
        updatePost,
        deletePost,
        publishPostNow,
        toggleAccountConnection,
        aiInitialPrompt,
        aiInitialCategory,
        aiInitialTab,
        navigateToAiWith,
        toast,
        showToast,
        isMobileDeviceView,
        setIsMobileDeviceView,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
