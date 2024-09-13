import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import useCloakAPI from '@/hooks/useCloakAPI';
import { ColumnDef } from '@tanstack/react-table';
import { ProfileData } from 'cloak-stealth';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type QueueOperation = {
  type: 'start' | 'stop';
  profileId: string;
};

function Hello() {
  const {
    getAllProfiles,
    start,
    createProfile,
    closeBrowser,
    deleteAllProfiles,
    loading,
    profiles,
    getActiveBrowserSessions,
    profileLoadingStates,
  } = useCloakAPI();

  const [runningProfiles, setRunningProfiles] = useState<string[]>([]);
  const [operationQueue, setOperationQueue] = useState<QueueOperation[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);

  useEffect(() => {
    fetchAllProfile();
  }, []);

  useEffect(() => {
    if (operationQueue.length > 0 && !isProcessingQueue) {
      processQueue();
    }
  }, [operationQueue, isProcessingQueue]);

  const fetchAllProfile = async () => {
    getAllProfiles();
    updateRunningProfiles();
  };
  const updateRunningProfiles = async () => {
    try {
      const activeSessions = await getActiveBrowserSessions();
      if (activeSessions && Array.isArray(activeSessions)) {
        setRunningProfiles(activeSessions.map((session) => session.profileId));
      } else {
        setRunningProfiles([]);
      }
    } catch (error) {
      console.error('Error fetching active sessions:', error);
    }
  };

  const handleCreateProfile = async () => {
    try {
      const profileCount = profiles?.length ?? 0;
      const newProfileId = await createProfile({
        name: `Profile ${profileCount + 1}`,
        os: 'mac',
        canvas: { mode: 'noise' },
      });
      console.log('New profile created:', newProfileId);
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const queueOperation = useCallback((operation: QueueOperation) => {
    setOperationQueue((prevQueue) => [...prevQueue, operation]);
  }, []);

  const processQueue = async () => {
    if (operationQueue.length === 0) return;

    setIsProcessingQueue(true);
    const operation = operationQueue[0];

    try {
      if (operation.type === 'start') {
        await start(operation.profileId);
      } else if (operation.type === 'stop') {
        await closeBrowser(operation.profileId);
      }
      await updateRunningProfiles();
    } catch (error) {
      console.error(`Error processing operation: ${operation.type}`, error);
    } finally {
      setOperationQueue((prevQueue) => prevQueue.slice(1));
      setIsProcessingQueue(false);
    }
  };

  const handleDeleteSelectedProfiles = async () => {
    try {
      console.log('Deleting profiles:', selectedProfileIds);
      await deleteAllProfiles(selectedProfileIds);
      setSelectedProfileIds([]);
      fetchAllProfile();
    } catch (error) {
      console.error('Error deleting profiles:', error);
    }
  };

  const columns = useMemo<ColumnDef<ProfileData>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedProfileIds.includes(row.original.id)}
            onCheckedChange={(value) => {
              if (value) {
                setSelectedProfileIds((prev) => [...prev, row.original.id]);
              } else {
                setSelectedProfileIds((prev) =>
                  prev.filter((id) => id !== row.original.id),
                );
              }
            }}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'os',
        header: 'OS',
      },
      {
        accessorKey: 'browserType',
        header: 'Browser Type',
      },
      {
        accessorKey: 'createdAt',
        header: 'Created At',
        cell: ({ row }) => {
          const createdAt = row.getValue('createdAt') as any;
          return createdAt ? new Date(createdAt).toLocaleString() : 'N/A';
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const profile = row.original;
          if (profileLoadingStates[profile.id]) {
            return 'Loading...';
          }
          return runningProfiles.includes(profile.id) ? (
            <p className="text-blue-500">Running...</p>
          ) : (
            'Ready'
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const profile = row.original;
          const isRunning = runningProfiles.includes(profile.id);
          const isLoading = profileLoadingStates[profile.id];
          return isRunning ? (
            <Button
              onClick={() =>
                queueOperation({ type: 'stop', profileId: profile.id })
              }
              className="border-red-500 text-red-500 hover:bg-red-100 bg-red-100"
              disabled={isLoading || isProcessingQueue}
              size="sm"
            >
              {isLoading ? 'Stopping...' : 'Stop'}
            </Button>
          ) : (
            <Button
              onClick={() =>
                queueOperation({ type: 'start', profileId: profile.id })
              }
              disabled={isProcessingQueue}
              loading={isLoading}
              size="sm"
            >
              {isLoading ? '' : 'Start'}
            </Button>
          );
        },
      },
    ],
    [
      runningProfiles,
      isProcessingQueue,
      queueOperation,
      profileLoadingStates,
      selectedProfileIds,
    ],
  );

  const onRowSelectionChange = useCallback(
    (updatedSelection: Record<string, boolean>) => {
      const selectedIds = Object.keys(updatedSelection).filter(
        (id) => updatedSelection[id],
      );
      setSelectedProfileIds(selectedIds);
    },
    [],
  );

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Cloak Stealth Demo: React & Electron App
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleCreateProfile}
            disabled={loading || isProcessingQueue}
          >
            Create New Profile
          </Button>
          <Button
            onClick={handleDeleteSelectedProfiles}
            disabled={selectedProfileIds.length === 0 || loading}
            variant="destructive"
          >
            Delete Selected Profiles ({selectedProfileIds.length})
          </Button>
          {/* <UserNav /> */}
        </div>
      </div>
      <div>
        <Button
          onClick={fetchAllProfile}
          variant="default"
          size="sm"
          disabled={loading}
        >
          Refesh
        </Button>
      </div>
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}
        <DataTable
          columns={columns}
          data={profiles ?? []}
          onRowSelectionChange={onRowSelectionChange}
        />
      </div>
    </div>
  );
}

export default Hello;
