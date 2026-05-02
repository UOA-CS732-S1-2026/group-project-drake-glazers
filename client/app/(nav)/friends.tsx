import { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';

import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useApiClient } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FriendRequest {
  id: string;
  name: string;
  sub: string;
  avatarBg: string;
  avatarColor: string;
  initials: string;
}

interface Friend {
  id: string;
  name: string;
  location: string;
  online: boolean;
  avatarBg: string;
  avatarColor: string;
  initials: string;
}

interface Suggestion {
  id: string;
  name: string;
  avatarBg: string;
  avatarColor: string;
  initials: string;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

interface AvatarProps {
  initials: string;
  bg: string;
  color: string;
  size?: number;
  online?: boolean;
}

function Avatar({ initials, bg, color, size = 52, online = false }: AvatarProps) {
  return (
    <View className="relative" style={{ width: size, height: size }}>
      <View
        className="items-center justify-center rounded-full"
        style={{ width: size, height: size, backgroundColor: bg }}
      >
        <Text variant="label-md" className="font-sans-bold" style={{ color, fontSize: size * 0.3 }}>
          {initials}
        </Text>
      </View>
      {online && (
        <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#22c55e] border-2 border-[#ffffff]" />
      )}
    </View>
  );
}

// ─── Friend Request Card ──────────────────────────────────────────────────────

interface FriendRequestCardProps extends FriendRequest {
  onAccept: () => void;
  onDecline: () => void;
}

function FriendRequestCard({
  name,
  sub,
  initials,
  avatarBg,
  avatarColor,
  onAccept,
  onDecline,
}: FriendRequestCardProps) {
  return (
    <Card className="mx-gutter mb-sm flex-row items-center gap-md bg-[#ffffff]">
      <Avatar initials={initials} bg={avatarBg} color={avatarColor} />
      <View className="flex-1">
        <Text variant="body-lg" className="text-[#1c1b1b]">
          {name}
        </Text>
        <Text variant="body-sm" className="text-[#6e5e5d]">
          {sub}
        </Text>
      </View>
      <TouchableOpacity
        className="w-9 h-9 rounded-full bg-[#f0eded] items-center justify-center"
        onPress={onDecline}
        activeOpacity={0.7}
      >
        <IconSymbol name="xmark" size={16} color="#6e5e5d" />
      </TouchableOpacity>
      <TouchableOpacity
        className="w-9 h-9 rounded-full bg-primary items-center justify-center"
        onPress={onAccept}
        activeOpacity={0.7}
      >
        <IconSymbol name="checkmark" size={16} color="#ffffff" />
      </TouchableOpacity>
    </Card>
  );
}

// ─── Friend Row ───────────────────────────────────────────────────────────────

function FriendRow({ name, location, online, initials, avatarBg, avatarColor }: Friend) {
  return (
    <Card className="mx-gutter mb-sm flex-row items-center gap-md bg-[#ffffff]">
      <Avatar initials={initials} bg={avatarBg} color={avatarColor} online={online} />
      <View className="flex-1">
        <Text variant="body-lg" className="text-[#1c1b1b]">
          {name}
        </Text>
        <View className="flex-row items-center gap-xs mt-xs">
          <IconSymbol name="location.fill" size={12} color="#6e5e5d" />
          <Text variant="body-sm" className="text-[#6e5e5d]">
            {location}
          </Text>
        </View>
      </View>
      <TouchableOpacity className="p-xs" activeOpacity={0.7}>
        <IconSymbol name="message.fill" size={20} color="#c8c0bf" />
      </TouchableOpacity>
    </Card>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function FriendsScreen() {
  const [search, setSearch] = useState('');
  const api = useApiClient();

  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [allFriends, setAllFriends] = useState<Friend[]>([]);

  const initialsFrom = (name?: string, id?: string) => {
    const src = name || id || '';
    const parts = src.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '??';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const pickColors = (seed?: string) => {
    const colors = ['#1a1a2e', '#2d2d2d', '#1e293b', '#2b2b2b', '#3b3b3b'];
    const accents = ['#c8b8f8', '#a8d8f0', '#f8a8c8', '#f0c080', '#c8d8a8'];
    const idx = seed
      ? Math.abs(Array.from(seed).reduce((s, c) => s + c.charCodeAt(0), 0)) % colors.length
      : 0;
    return { bg: colors[idx], color: accents[idx] };
  };

  const fetchData = useCallback(async () => {
    try {
      const [frResp, friendsResp] = await Promise.all([
        api.get('/friend-requests'),
        api.get('/friends'),
      ] as const);

      // friend-requests returns { incoming, outgoing }
      const incoming: any[] = frResp.incoming || [];

      const mappedRequests: FriendRequest[] = incoming.map((r) => {
        const name = r.fromUserId || r.id;
        const initials = initialsFrom(name, r.fromUserId);
        const { bg, color } = pickColors(r.fromUserId);

        return {
          id: r.id,
          name,
          sub: 'Pending request',
          initials,
          avatarBg: bg,
          avatarColor: color,
        };
      });

      setRequests(mappedRequests);

      // friends endpoint returns array with { id, createdAt, friend: { id, profile: { displayName, avatarUrl } } }
      const mappedFriends: Friend[] = (friendsResp || []).map((f: any) => {
        const displayName = f.friend?.profile?.displayName || 'Friend';
        const initials = initialsFrom(displayName, f.friend?.id);
        const { bg, color } = pickColors(f.friend?.id);

        return {
          id: f.friend?.id || f.id,
          name: displayName,
          location: 'Nearby',
          online: false,
          initials,
          avatarBg: bg,
          avatarColor: color,
        };
      });

      setAllFriends(mappedFriends);
    } catch (error) {
      // Fail silently for now; in-app error handling could be added later.
      console.warn('Failed to fetch friends or requests', error);
    }
  }, [api]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleAccept = async (id: string) => {
    try {
      await api.put(`/friend-requests/${id}/accept`, {});
      setRequests((prev) => prev.filter((r) => r.id !== id));
      // refresh friends list
      const friendsResp = await api.get('/friends');
      const mappedFriends: Friend[] = (friendsResp || []).map((f: any) => {
        const displayName = f.friend?.profile?.displayName || 'Friend';
        const initials = initialsFrom(displayName, f.friend?.id);
        const { bg, color } = pickColors(f.friend?.id);

        return {
          id: f.friend?.id || f.id,
          name: displayName,
          location: 'Nearby',
          online: false,
          initials,
          avatarBg: bg,
          avatarColor: color,
        };
      });
      setAllFriends(mappedFriends);
    } catch (error) {
      console.warn('Accept failed', error);
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await api.put(`/friend-requests/${id}/decline`, {});
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.warn('Decline failed', error);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-[#fcf9f8]"
      contentContainerClassName="flex-grow pb-24"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-gutter py-md bg-[#fcf9f8]">
        <View className="flex-row items-center gap-sm">
          <View className="w-9 h-9 rounded-full bg-primary items-center justify-center">
            <IconSymbol name="person.crop.circle.fill" size={20} color="#ffffff" />
          </View>
          <Text variant="headline-md" className="text-[#1c1b1b]">
            Memoriez
          </Text>
        </View>
      </View>

      {/* Search */}
      <View className="px-gutter mb-md">
        <Input
          placeholder="Find friends or scan QR..."
          value={search}
          onChangeText={setSearch}
          className="rounded-full"
        />
      </View>

      {/* Friend Requests */}
      <View className="flex-row items-center gap-sm px-gutter mb-sm">
        <Text variant="headline-md" className="text-[#1c1b1b]">
          Friend Requests
        </Text>
        <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
          <Text variant="label-md" className="text-on-primary">
            {requests.length}
          </Text>
        </View>
      </View>

      {requests.map((req) => (
        <FriendRequestCard
          key={req.id}
          {...req}
          onAccept={() => handleAccept(req.id)}
          onDecline={() => handleDecline(req.id)}
        />
      ))}

      {/* All Friends */}
      <View className="flex-row items-center justify-between px-gutter mt-lg mb-sm">
        <Text variant="headline-md" className="text-[#1c1b1b]">
          All Friends
        </Text>
      </View>

      {allFriends.map((f) => (
        <FriendRow key={f.id} {...f} />
      ))}
    </ScrollView>
  );
}
