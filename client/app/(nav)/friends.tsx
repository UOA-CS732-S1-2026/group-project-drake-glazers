import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'friends' | 'incoming' | 'outgoing' | 'blocked';

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  mutualFriends?: number;
  since?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const FRIENDS: User[] = [
  {
    id: '1',
    name: 'Aroha Ngata',
    username: '@aroha',
    avatar: 'https://i.pravatar.cc/150?img=47',
    mutualFriends: 6,
    since: 'Jan 2024',
  },
  {
    id: '2',
    name: 'Tama Waititi',
    username: '@tamaw',
    avatar: 'https://i.pravatar.cc/150?img=12',
    mutualFriends: 2,
    since: 'Mar 2024',
  },
  {
    id: '3',
    name: 'Hine Walker',
    username: '@hinewalks',
    avatar: 'https://i.pravatar.cc/150?img=32',
    mutualFriends: 9,
    since: 'Nov 2023',
  },
  {
    id: '4',
    name: 'Mere Tūhoe',
    username: '@mere_t',
    avatar: 'https://i.pravatar.cc/150?img=56',
    mutualFriends: 1,
    since: 'Jun 2024',
  },
];

const INCOMING: User[] = [
  {
    id: '5',
    name: 'James Pōhatu',
    username: '@jamespohatu',
    avatar: 'https://i.pravatar.cc/150?img=15',
    mutualFriends: 3,
  },
  {
    id: '6',
    name: 'Sofia Renata',
    username: '@sofiar',
    avatar: 'https://i.pravatar.cc/150?img=44',
    mutualFriends: 0,
  },
];

const OUTGOING: User[] = [
  {
    id: '7',
    name: 'Liam Tūhoe',
    username: '@liamt',
    avatar: 'https://i.pravatar.cc/150?img=68',
    mutualFriends: 5,
  },
];

const BLOCKED: User[] = [
  {
    id: '8',
    name: 'Blocked User',
    username: '@hidden',
    avatar: 'https://i.pravatar.cc/150?img=70',
  },
];

const SEARCH_RESULTS: User[] = [
  {
    id: '9',
    name: 'Ngāti Raukawa',
    username: '@ngatir',
    avatar: 'https://i.pravatar.cc/150?img=25',
    mutualFriends: 2,
  },
  {
    id: '10',
    name: 'Kiri Parata',
    username: '@kiriparata',
    avatar: 'https://i.pravatar.cc/150?img=37',
    mutualFriends: 7,
  },
];

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
        {/* Head */}
        <View
          style={{
            width: size * 0.38,
            height: size * 0.38,
            borderRadius: size * 0.19,
            backgroundColor: '#9E9E9E',
            marginBottom: size * 0.04,
          }}
        />
        {/* Shoulders */}
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

function FriendRow({ user, onRemove }: { user: User; onRemove: (id: string) => void }) {
  return (
    <Card elevated={false} className="flex-row items-center gap-md mb-sm">
      <Avatar uri={user.avatar} />
      <View className="flex-1 gap-xs">
        <Text variant="body-md" className="font-sans-semibold">
          {user.name}
        </Text>
        <Text variant="body-sm" className="text-on-surface-variant">
          {user.username}
        </Text>
        {user.mutualFriends !== undefined && user.mutualFriends > 0 && (
          <Badge label={`${user.mutualFriends} mutual`} variant="secondary" />
        )}
      </View>
      <Button label="Remove" variant="ghost" onPress={() => onRemove(user.id)} className="px-sm" />
    </Card>
  );
}

function IncomingRow({
  user,
  onAccept,
  onDecline,
}: {
  user: User;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  return (
    <Card elevated={false} className="mb-sm">
      <View className="flex-row items-center gap-md mb-sm">
        <Avatar uri={user.avatar} />
        <View className="flex-1 gap-xs">
          <Text variant="body-md" className="font-sans-semibold">
            {user.name}
          </Text>
          <Text variant="body-sm" className="text-on-surface-variant">
            {user.username}
          </Text>
          {user.mutualFriends !== undefined && user.mutualFriends > 0 && (
            <Badge label={`${user.mutualFriends} mutual`} variant="primary" />
          )}
        </View>
      </View>
      <View className="flex-row gap-sm">
        <Button
          label="Accept"
          variant="primary"
          onPress={() => onAccept(user.id)}
          className="flex-1"
        />
        <Button
          label="Decline"
          variant="secondary"
          onPress={() => onDecline(user.id)}
          className="flex-1"
        />
      </View>
    </Card>
  );
}

function OutgoingRow({ user, onCancel }: { user: User; onCancel: (id: string) => void }) {
  return (
    <Card elevated={false} className="flex-row items-center gap-md mb-sm">
      <Avatar uri={user.avatar} />
      <View className="flex-1 gap-xs">
        <Text variant="body-md" className="font-sans-semibold">
          {user.name}
        </Text>
        <Text variant="body-sm" className="text-on-surface-variant">
          {user.username}
        </Text>
        <Badge label="Pending" variant="tertiary" />
      </View>
      <Button label="Cancel" variant="ghost" onPress={() => onCancel(user.id)} className="px-sm" />
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
        <Text variant="body-sm" className="text-on-surface-variant">
          {user.username}
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
        <Text variant="body-sm" className="text-on-surface-variant">
          {user.username}
        </Text>
        {user.mutualFriends !== undefined && user.mutualFriends > 0 && (
          <Badge label={`${user.mutualFriends} mutual`} variant="secondary" />
        )}
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

const TABS: { key: Tab; label: string; count?: number }[] = [
  { key: 'friends', label: 'Friends', count: FRIENDS.length },
  { key: 'incoming', label: 'Requests', count: INCOMING.length },
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
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [search, setSearch] = useState('');

  const [friends, setFriends] = useState(FRIENDS);
  const [incoming, setIncoming] = useState(INCOMING);
  const [outgoing, setOutgoing] = useState(OUTGOING);
  const [blocked, setBlocked] = useState(BLOCKED);

  const showSearch = search.trim().length > 0;

  const handleAccept = (id: string) => {
    const user = incoming.find((u) => u.id === id);
    if (user) {
      setFriends((prev) => [...prev, { ...user, since: 'Now' }]);
      setIncoming((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const handleDecline = (id: string) => setIncoming((prev) => prev.filter((u) => u.id !== id));
  const handleCancelOutgoing = (id: string) =>
    setOutgoing((prev) => prev.filter((u) => u.id !== id));
  const handleRemoveFriend = (id: string) => setFriends((prev) => prev.filter((u) => u.id !== id));
  const handleUnblock = (id: string) => setBlocked((prev) => prev.filter((u) => u.id !== id));
  const handleAddFromSearch = (id: string) => {
    // In a real app: send friend request
    setSearch('');
  };

  const renderContent = () => {
    if (showSearch) {
      return (
        <>
          <Text
            variant="label-md"
            className="text-on-surface-variant mb-sm tracking-widest uppercase"
          >
            Results for &ldquo;{search}&rdquo;
          </Text>
          {SEARCH_RESULTS.length === 0 ? (
            <EmptyState message="No users found." />
          ) : (
            SEARCH_RESULTS.map((u) => (
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
          friends.map((u) => <FriendRow key={u.id} user={u} onRemove={handleRemoveFriend} />)
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
        {/* Header */}
        <Text variant="headline-lg" className="mb-md">
          Friends
        </Text>

        {/* Search */}
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

        {/* Tabs (hidden while searching) */}
        {!showSearch && (
          <TabBar active={activeTab} onChange={setActiveTab} incomingCount={incoming.length} />
        )}

        {/* Content */}
        {renderContent()}
      </ScrollView>
    </View>
  );
}
