import {
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  useFriends,
  useFriendRequests,
  useBlockedUsers,
  useUserSearch,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useCancelFriendRequest,
  useRemoveFriend,
  useBlockUser,
  useUnblockUser,
} from '@/hooks/use-friends';

// --- Shared sub-components ---

function AvatarCircle({
  name,
  avatarUrl,
  size = 40,
}: {
  name: string | null | undefined;
  avatarUrl?: string | null;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className="shrink-0"
      />
    );
  }

  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  return (
    <View
      style={{ width: size, height: size }}
      className="rounded-full bg-primary-fixed items-center justify-center shrink-0"
    >
      <Text variant="label-md" className="text-primary">
        {initials}
      </Text>
    </View>
  );
}

type TabOption<T extends string> = { label: string; value: T };

function TabSwitcher<T extends string>({
  options,
  value,
  onChange,
}: {
  options: TabOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row bg-surface-container rounded-lg p-xs gap-xs">
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => onChange(opt.value)}
          className={`flex-1 items-center py-sm rounded-md ${
            value === opt.value ? 'bg-surface-container-lowest' : ''
          }`}
        >
          <Text
            variant="label-md"
            className={value === opt.value ? 'text-on-surface' : 'text-on-surface-variant'}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// --- Search Section ---

function SearchSection() {
  const [query, setQuery] = useState('');
  const [sentIds, setSentIds] = useState(new Set<string>());
  const { data: results, isLoading, isError } = useUserSearch(query);
  const { data: friends } = useFriends();
  const { data: requests } = useFriendRequests();
  const sendRequest = useSendFriendRequest();

  const excludedIds = new Set<string>([
    ...(friends?.map((f) => f.friend.id) ?? []),
    ...(requests?.outgoing.map((r) => r.toUserId) ?? []),
    ...(requests?.incoming.map((r) => r.fromUserId) ?? []),
  ]);

  // sentIds keeps just-added users visible until the search bar loses focus
  const filteredResults = results?.filter((u) => sentIds.has(u.id) || !excludedIds.has(u.id));

  return (
    <View className="gap-md">
      <Text variant="headline-md">Find Friends</Text>
      <Input
        placeholder="Search by name or email..."
        value={query}
        onChangeText={setQuery}
        onBlur={() => setSentIds(new Set())}
        className="rounded-full"
      />

      {query.trim().length > 0 && (
        <View className="gap-sm">
          {isLoading && (
            <View className="items-center py-md">
              <ActivityIndicator color="#b71422" />
            </View>
          )}
          {isError && (
            <Text variant="body-sm" className="text-error text-center py-md">
              Search failed — please try again
            </Text>
          )}
          {!isLoading && !isError && filteredResults?.length === 0 && (
            <Text variant="body-sm" className="text-on-surface-variant text-center py-md">
              {`No eligible users found for "${query}"`}
            </Text>
          )}
          {!isLoading &&
            !isError &&
            filteredResults?.map((user) => (
              <Card key={user.id} elevated={false} className="flex-row items-center gap-md">
                <AvatarCircle
                  name={user.profile?.displayName}
                  avatarUrl={user.profile?.avatarUrl}
                />
                <Text variant="body-md" className="flex-1" numberOfLines={1}>
                  {user.profile?.displayName ?? 'Unknown User'}
                </Text>
                <Button
                  label={sentIds.has(user.id) ? 'Sent' : 'Add Friend'}
                  variant="secondary"
                  disabled={sentIds.has(user.id)}
                  loading={sendRequest.isPending && sendRequest.variables === user.id}
                  onPress={() =>
                    sendRequest.mutate(user.id, {
                      onSuccess: () => setSentIds((prev) => new Set(prev).add(user.id)),
                    })
                  }
                />
              </Card>
            ))}
        </View>
      )}
    </View>
  );
}

// --- Friend Requests Section ---

const REQUEST_TABS: TabOption<'incoming' | 'outgoing'>[] = [
  { label: 'Incoming', value: 'incoming' },
  { label: 'Outgoing', value: 'outgoing' },
];

function RequestsSection() {
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const { data: requests, isLoading, isError } = useFriendRequests();
  const accept = useAcceptFriendRequest();
  const reject = useRejectFriendRequest();
  const cancel = useCancelFriendRequest();

  const list = tab === 'incoming' ? requests?.incoming : requests?.outgoing;

  return (
    <View className="gap-md">
      <Text variant="headline-md">Friend Requests</Text>
      <TabSwitcher options={REQUEST_TABS} value={tab} onChange={setTab} />

      {isLoading && (
        <View className="items-center py-md">
          <ActivityIndicator color="#b71422" />
        </View>
      )}
      {isError && (
        <Text variant="body-sm" className="text-error text-center py-md">
          Failed to load requests
        </Text>
      )}
      {!isLoading && !isError && list?.length === 0 && (
        <Text variant="body-sm" className="text-on-surface-variant text-center py-md">
          {tab === 'incoming' ? 'No incoming requests' : 'No outgoing requests'}
        </Text>
      )}
      {!isLoading &&
        !isError &&
        list?.map((req) => {
          const otherUser = tab === 'incoming' ? req.fromUser : req.toUser;
          const displayName = otherUser.profile?.displayName ?? 'Unknown User';
          return (
            <Card key={req.id} elevated={false} className="flex-row items-center gap-md">
              <AvatarCircle name={displayName} avatarUrl={otherUser.profile?.avatarUrl} />
              <Text variant="body-md" className="flex-1" numberOfLines={1}>
                {displayName}
              </Text>
              {tab === 'incoming' ? (
                <View className="flex-row gap-sm">
                  <Button
                    label="Accept"
                    loading={accept.isPending && accept.variables === req.id}
                    onPress={() => accept.mutate(req.id)}
                  />
                  <Button
                    label="Reject"
                    variant="secondary"
                    loading={reject.isPending && reject.variables === req.id}
                    onPress={() => reject.mutate(req.id)}
                  />
                </View>
              ) : (
                <Button
                  label="Cancel"
                  variant="secondary"
                  loading={cancel.isPending && cancel.variables === req.id}
                  onPress={() => cancel.mutate(req.id)}
                />
              )}
            </Card>
          );
        })}
    </View>
  );
}

// --- Friends + Blocked Section ---

const FRIENDS_TABS: TabOption<'friends' | 'blocked'>[] = [
  { label: 'All Friends', value: 'friends' },
  { label: 'Blocked', value: 'blocked' },
];

function FriendsSection() {
  const [tab, setTab] = useState<'friends' | 'blocked'>('friends');

  const { data: friends, isLoading: friendsLoading, isError: friendsError } = useFriends();
  const { data: blocked, isLoading: blockedLoading, isError: blockedError } = useBlockedUsers();
  const removeFriend = useRemoveFriend();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();

  const isLoading = tab === 'friends' ? friendsLoading : blockedLoading;
  const isError = tab === 'friends' ? friendsError : blockedError;

  return (
    <View className="gap-md">
      <Text variant="headline-md">My Friends</Text>
      <TabSwitcher options={FRIENDS_TABS} value={tab} onChange={setTab} />

      {isLoading && (
        <View className="items-center py-md">
          <ActivityIndicator color="#b71422" />
        </View>
      )}
      {isError && (
        <Text variant="body-sm" className="text-error text-center py-md">
          {tab === 'friends' ? 'Failed to load friends' : 'Failed to load blocked users'}
        </Text>
      )}

      {!isLoading && !isError && tab === 'friends' && (
        <>
          {(!friends || friends.length === 0) && (
            <Text variant="body-sm" className="text-on-surface-variant text-center py-md">
              No friends yet — search above to connect with people
            </Text>
          )}
          {friends?.map(({ id, friend }) => (
            <Card key={id} elevated={false} className="flex-row items-center gap-md">
              <Pressable
                onPress={() => router.push(`/friends/${friend.id}` as any)}
                className="flex-row items-center gap-md flex-1 min-w-0"
              >
                <AvatarCircle
                  name={friend.profile?.displayName}
                  avatarUrl={friend.profile?.avatarUrl}
                />
                <Text variant="body-md" className="flex-1" numberOfLines={1}>
                  {friend.profile?.displayName ?? 'Unknown User'}
                </Text>
              </Pressable>
              <View className="flex-row gap-sm">
                <Button
                  label="Block"
                  variant="ghost"
                  loading={blockUser.isPending && blockUser.variables === friend.id}
                  onPress={() => blockUser.mutate(friend.id)}
                />
                <Button
                  label="Remove"
                  variant="secondary"
                  loading={removeFriend.isPending && removeFriend.variables === friend.id}
                  onPress={() => removeFriend.mutate(friend.id)}
                />
              </View>
            </Card>
          ))}
        </>
      )}

      {!isLoading && !isError && tab === 'blocked' && (
        <>
          {(!blocked || blocked.length === 0) && (
            <Text variant="body-sm" className="text-on-surface-variant text-center py-md">
              No blocked users
            </Text>
          )}
          {blocked?.map((entry) => (
            <Card key={entry.id} elevated={false} className="flex-row items-center gap-md">
              <AvatarCircle
                name={entry.blocked.profile?.displayName}
                avatarUrl={entry.blocked.profile?.avatarUrl}
              />
              <Text variant="body-md" className="flex-1" numberOfLines={1}>
                {entry.blocked.profile?.displayName ?? 'Unknown User'}
              </Text>
              <Button
                label="Unblock"
                variant="secondary"
                loading={unblockUser.isPending && unblockUser.variables === entry.blocked.id}
                onPress={() => unblockUser.mutate(entry.blocked.id)}
              />
            </Card>
          ))}
        </>
      )}
    </View>
  );
}

// --- Screen ---

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}
      contentContainerClassName="px-gutter gap-xl"
      keyboardShouldPersistTaps="handled"
    >
      <Text variant="headline-lg">Friends</Text>
      <SearchSection />
      <RequestsSection />
      <FriendsSection />
    </ScrollView>
  );
}
