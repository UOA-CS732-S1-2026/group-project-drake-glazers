import { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useAuth } from '@clerk/expo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'friends' | 'incoming' | 'outgoing' | 'blocked';

interface User {
  id: string;
  name: string;
  avatar: string;
  requestId?: string;
}

// ─── API response → UI model mappers ─────────────────────────────────────────

function mapFriend(item: any): User {
  return {
    id: item.friend.id,
    name: item.friend.profile?.displayName ?? item.friend.id,
    avatar: item.friend.profile?.avatarUrl ?? '',
  };
}

function mapRequest(item: any, direction: 'incoming' | 'outgoing'): User {
  const profile = direction === 'incoming' ? item.fromUser?.profile : item.toUser?.profile;
  const userId = direction === 'incoming' ? item.fromUserId : item.toUserId;
  return {
    id: userId,
    name: profile?.displayName ?? userId,
    avatar: profile?.avatarUrl ?? '',
    requestId: item.id,
  };
}

function mapBlock(item: any): User {
  return {
    id: item.blocked.id,
    name: item.blocked.profile?.displayName ?? item.blocked.id,
    avatar: item.blocked.profile?.avatarUrl ?? '',
  };
}

function mapSearchResult(item: any): User {
  return {
    id: item.id,
    name: item.profile?.displayName ?? item.id,
    avatar: item.profile?.avatarUrl ?? '',
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ uri, size = 48 }: { uri: string; size?: number }) {
  const [hasError, setHasError] = useState(false);

  if (!uri || hasError) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#D0D0D0',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: size * 0.38,
            height: size * 0.38,
            borderRadius: size * 0.19,
            backgroundColor: '#9E9E9E',
            marginBottom: size * 0.04,
          }}
        />
        <View
          style={{
            width: size * 0.7,
            height: size * 0.5,
            borderRadius: (size * 0.7) / 2,
            backgroundColor: '#9E9E9E',
          }}
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      onError={() => setHasError(true)}
    />
  );
}

function FriendRow({
  user,
  onRemove,
  onViewMemories,
}: {
  user: User;
  onRemove: (id: string) => void;
  onViewMemories: (id: string) => void;
}) {
  return (
    <Card elevated={false} className="mb-sm">
      <View className="flex-row items-center gap-md">
        <Avatar uri={user.avatar} />
        <View className="flex-1 gap-xs">
          <Text variant="body-md" className="font-sans-semibold">
            {user.name}
          </Text>
        </View>
        <Button
          label="Remove"
          variant="ghost"
          onPress={() => onRemove(user.id)}
          className="px-sm"
        />
      </View>
      <Button
        label="View memories"
        variant="secondary"
        onPress={() => onViewMemories(user.id)}
        className="mt-sm"
      />
    </Card>
  );
}

function IncomingRow({
  user,
  onAccept,
  onDecline,
}: {
  user: User;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
}) {
  return (
    <Card elevated={false} className="mb-sm">
      <View className="flex-row items-center gap-md mb-sm">
        <Avatar uri={user.avatar} />
        <View className="flex-1 gap-xs">
          <Text variant="body-md" className="font-sans-semibold">
            {user.name}
          </Text>
        </View>
      </View>
      <View className="flex-row gap-sm">
        <Button
          label="Accept"
          variant="primary"
          onPress={() => onAccept(user.requestId!)}
          className="flex-1"
        />
        <Button
          label="Decline"
          variant="secondary"
          onPress={() => onDecline(user.requestId!)}
          className="flex-1"
        />
      </View>
    </Card>
  );
}

function OutgoingRow({ user, onCancel }: { user: User; onCancel: (requestId: string) => void }) {
  return (
    <Card elevated={false} className="flex-row items-center gap-md mb-sm">
      <Avatar uri={user.avatar} />
      <View className="flex-1 gap-xs">
        <Text variant="body-md" className="font-sans-semibold">
          {user.name}
        </Text>
        <Badge label="Pending" variant="tertiary" />
      </View>
      <Button
        label="Cancel"
        variant="ghost"
        onPress={() => onCancel(user.requestId!)}
        className="px-sm"
      />
    </Card>
  );
}

function BlockedRow({ user, onUnblock }: { user: User; onUnblock: (id: string) => void }) {
  return (
    <Card elevated={false} className="flex-row items-center gap-md mb-sm">
      <View style={{ opacity: 0.5 }}>
        <Avatar uri={user.avatar} />
      </View>
      <View className="flex-1 gap-xs">
        <Text variant="body-md" className="font-sans-semibold">
          {user.name}
        </Text>
      </View>
      <Button
        label="Unblock"
        variant="secondary"
        onPress={() => onUnblock(user.id)}
        className="px-sm"
      />
    </Card>
  );
}

function SearchResultRow({ user, onAdd }: { user: User; onAdd: (id: string) => void }) {
  return (
    <Card elevated={false} className="flex-row items-center gap-md mb-sm">
      <Avatar uri={user.avatar} />
      <View className="flex-1 gap-xs">
        <Text variant="body-md" className="font-sans-semibold">
          {user.name}
        </Text>
      </View>
      <Button label="Add" variant="primary" onPress={() => onAdd(user.id)} className="px-md" />
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View className="items-center justify-center py-xl gap-sm">
      <Text variant="body-md" className="text-on-surface-variant text-center">
        {message}
      </Text>
    </View>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

type TabDef = { key: Tab; label: string };

const TABS: TabDef[] = [
  { key: 'friends', label: 'Friends' },
  { key: 'incoming', label: 'Requests' },
  { key: 'outgoing', label: 'Sent' },
  { key: 'blocked', label: 'Blocked' },
];

function TabBar({
  active,
  onChange,
  incomingCount,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  incomingCount: number;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-md"
      contentContainerStyle={{ gap: 8, paddingHorizontal: 0 }}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        const showBadge = tab.key === 'incoming' && incomingCount > 0;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.7}
            className={`flex-row items-center gap-xs px-md py-sm rounded-full border ${
              isActive
                ? 'bg-primary border-primary'
                : 'bg-surface-container-lowest border-outline-variant'
            }`}
          >
            <Text
              variant="label-md"
              className={isActive ? 'text-on-primary' : 'text-on-surface-variant'}
            >
              {tab.label}
            </Text>
            {showBadge && (
              <View className="bg-error rounded-full w-5 h-5 items-center justify-center">
                <Text variant="label-md" className="text-on-primary text-xs">
                  {incomingCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FriendsPage() {
  const { getToken } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);

  const [friends, setFriends] = useState<User[]>([]);
  const [incoming, setIncoming] = useState<User[]>([]);
  const [outgoing, setOutgoing] = useState<User[]>([]);
  const [blocked, setBlocked] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showSearch = search.trim().length > 0;

  // ── API helper ─────────────────────────────────────────────────────────────

  const apiFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ── Initial data load ──────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [friendsData, requestsData, blocksData] = await Promise.all([
        apiFetch('/friends'),
        apiFetch('/friend-requests'),
        apiFetch('/blocks'),
      ]);

      setFriends(friendsData.map(mapFriend));
      setIncoming(requestsData.incoming.map((r: any) => mapRequest(r, 'incoming')));
      setOutgoing(requestsData.outgoing.map((r: any) => mapRequest(r, 'outgoing')));
      setBlocked(blocksData.map(mapBlock));
    } catch {
      setError('Failed to load friends data.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Search ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!showSearch) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await apiFetch(`/users/search?q=${encodeURIComponent(search.trim())}`);
        setSearchResults(data.map(mapSearchResult));
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search, showSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleAccept = async (requestId: string) => {
    try {
      await apiFetch(`/friend-requests/${requestId}/accept`, { method: 'PUT' });
      await loadAll();
    } catch {
      setError('Failed to accept request.');
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await apiFetch(`/friend-requests/${requestId}/decline`, { method: 'PUT' });
      setIncoming((prev) => prev.filter((u) => u.requestId !== requestId));
    } catch {
      setError('Failed to decline request.');
    }
  };

  const handleCancelOutgoing = async (requestId: string) => {
    try {
      await apiFetch(`/friend-requests/${requestId}`, { method: 'DELETE' });
      setOutgoing((prev) => prev.filter((u) => u.requestId !== requestId));
    } catch {
      setError('Failed to cancel request.');
    }
  };

  const handleRemoveFriend = async (userId: string) => {
    try {
      await apiFetch(`/friends/${userId}`, { method: 'DELETE' });
      setFriends((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      setError('Failed to remove friend.');
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await apiFetch(`/blocks/${userId}`, { method: 'DELETE' });
      setBlocked((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      setError('Failed to unblock user.');
    }
  };

  const handleAddFromSearch = async (userId: string) => {
    try {
      await apiFetch('/friend-requests', {
        method: 'POST',
        body: JSON.stringify({ toUserId: userId }),
      });
      setSearch('');
    } catch {
      setError('Failed to send friend request.');
    }
  };

  const handleViewMemories = (userId: string) => {
    // TODO: navigate to memories screen, e.g. router.push(`/memories/${userId}`)
    // Endpoint: GET /users/:userId/memories
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const renderContent = () => {
    if (loading) {
      return (
        <View className="items-center justify-center py-xl">
          <ActivityIndicator />
        </View>
      );
    }

    if (error) {
      return <EmptyState message={error} />;
    }

    if (showSearch) {
      if (searchLoading) {
        return (
          <View className="items-center justify-center py-xl">
            <ActivityIndicator />
          </View>
        );
      }
      return (
        <>
          <Text
            variant="label-md"
            className="text-on-surface-variant mb-sm tracking-widest uppercase"
          >
            Results for &ldquo;{search}&rdquo;
          </Text>
          {searchResults.length === 0 ? (
            <EmptyState message="No users found." />
          ) : (
            searchResults.map((u) => (
              <SearchResultRow key={u.id} user={u} onAdd={handleAddFromSearch} />
            ))
          )}
        </>
      );
    }

    switch (activeTab) {
      case 'friends':
        return friends.length === 0 ? (
          <EmptyState message="No friends yet. Search above to find people." />
        ) : (
          friends.map((u) => (
            <FriendRow
              key={u.id}
              user={u}
              onRemove={handleRemoveFriend}
              onViewMemories={handleViewMemories}
            />
          ))
        );
      case 'incoming':
        return incoming.length === 0 ? (
          <EmptyState message="No pending requests." />
        ) : (
          incoming.map((u) => (
            <IncomingRow key={u.id} user={u} onAccept={handleAccept} onDecline={handleDecline} />
          ))
        );
      case 'outgoing':
        return outgoing.length === 0 ? (
          <EmptyState message="No outgoing requests." />
        ) : (
          outgoing.map((u) => <OutgoingRow key={u.id} user={u} onCancel={handleCancelOutgoing} />)
        );
      case 'blocked':
        return blocked.length === 0 ? (
          <EmptyState message="No blocked users." />
        ) : (
          blocked.map((u) => <BlockedRow key={u.id} user={u} onUnblock={handleUnblock} />)
        );
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headline-lg" className="mb-md">
          Friends
        </Text>

        <Input
          label={undefined}
          placeholder="Search for people…"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          className="mb-md"
        />

        {!showSearch && (
          <TabBar active={activeTab} onChange={setActiveTab} incomingCount={incoming.length} />
        )}

        {renderContent()}
      </ScrollView>
    </View>
  );
}
