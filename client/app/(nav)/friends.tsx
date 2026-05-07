import { View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
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

function AvatarCircle({ name, size = 40 }: { name: string | null | undefined; size?: number }) {
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
  const { data: results, isLoading, isError } = useUserSearch(query);
  const sendRequest = useSendFriendRequest();

  return (
    <View className="gap-md">
      <Text variant="headline-md">Find Friends</Text>
      <Input
        placeholder="Search by name or email..."
        value={query}
        onChangeText={setQuery}
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
          {!isLoading && !isError && results?.length === 0 && (
            <Text variant="body-sm" className="text-on-surface-variant text-center py-md">
              {`No users found for "${query}"`}
            </Text>
          )}
          {!isLoading &&
            !isError &&
            results?.map((user) => (
              <Card key={user.id} elevated={false} className="flex-row items-center gap-md">
                <AvatarCircle name={user.profile?.displayName} />
                <Text variant="body-md" className="flex-1" numberOfLines={1}>
                  {user.profile?.displayName ?? 'Unknown User'}
                </Text>
                <Button
                  label="Add Friend"
                  variant="secondary"
                  loading={sendRequest.isPending && sendRequest.variables === user.id}
                  onPress={() => sendRequest.mutate(user.id)}
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
              <AvatarCircle name={displayName} />
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
              <AvatarCircle name={friend.profile?.displayName} />
              <Text variant="body-md" className="flex-1" numberOfLines={1}>
                {friend.profile?.displayName ?? 'Unknown User'}
              </Text>
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
              <AvatarCircle name={entry.blocked.profile?.displayName} />
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
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-gutter py-lg gap-xl"
      keyboardShouldPersistTaps="handled"
    >
      <Text variant="headline-lg">Friends</Text>
      <SearchSection />
      <RequestsSection />
      <FriendsSection />
    </ScrollView>
  );
}
