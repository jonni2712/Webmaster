'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, Shield, User, Eye, Crown, Trash2, Settings, Globe } from 'lucide-react';
import type { TeamMember, MemberRole } from '@/types/database';

interface TeamMembersListProps {
  currentUserRole: MemberRole;
  onInviteClick: () => void;
  onSiteAccessClick: (member: TeamMember) => void;
}

const roleLabels: Record<MemberRole, string> = {
  owner: 'Proprietario',
  admin: 'Amministratore',
  member: 'Membro',
  viewer: 'Visualizzatore',
};

const roleIcons: Record<MemberRole, typeof Shield> = {
  owner: Crown,
  admin: Shield,
  member: User,
  viewer: Eye,
};

const roleColors: Record<MemberRole, string> = {
  owner: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  member: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export function TeamMembersList({
  currentUserRole,
  onInviteClick,
  onSiteAccessClick,
}: TeamMembersListProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [memberToChangeRole, setMemberToChangeRole] = useState<{
    member: TeamMember;
    newRole: MemberRole;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      const response = await fetch('/api/team/members');
      const data = await response.json();
      if (response.ok) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveMember() {
    if (!memberToRemove) return;
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/team/members/${memberToRemove.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMembers(members.filter(m => m.id !== memberToRemove.id));
      }
    } catch (error) {
      console.error('Error removing member:', error);
    } finally {
      setIsUpdating(false);
      setMemberToRemove(null);
    }
  }

  async function handleChangeRole() {
    if (!memberToChangeRole) return;
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/team/members/${memberToChangeRole.member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: memberToChangeRole.newRole }),
      });

      if (response.ok) {
        setMembers(
          members.map(m =>
            m.id === memberToChangeRole.member.id
              ? { ...m, role: memberToChangeRole.newRole }
              : m
          )
        );
      }
    } catch (error) {
      console.error('Error changing role:', error);
    } finally {
      setIsUpdating(false);
      setMemberToChangeRole(null);
    }
  }

  function canManageMember(member: TeamMember): boolean {
    if (member.role === 'owner') return false;
    if (currentUserRole === 'owner') return true;
    if (currentUserRole === 'admin' && member.role !== 'admin') return true;
    return false;
  }

  function getAvailableRoles(member: TeamMember): MemberRole[] {
    const roles: MemberRole[] = ['member', 'viewer'];
    if (currentUserRole === 'owner') {
      roles.unshift('admin');
    }
    return roles.filter(r => r !== member.role);
  }

  function getInitials(name: string | null, email: string): string {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.substring(0, 2).toUpperCase();
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="border rounded-lg">
          <div className="h-64 bg-muted/50 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {members.length} membr{members.length === 1 ? 'o' : 'i'} nel team
        </p>
        {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
          <Button onClick={onInviteClick}>Invita membro</Button>
        )}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membro</TableHead>
              <TableHead>Ruolo</TableHead>
              <TableHead>Accesso siti</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map(member => {
              const RoleIcon = roleIcons[member.role];
              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback>
                          {getInitials(member.name, member.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.name || member.email.split('@')[0]}
                        </p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={roleColors[member.role]}
                    >
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {roleLabels[member.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.role === 'owner' || member.role === 'admin' ? (
                      <span className="text-sm text-muted-foreground">Tutti i siti</span>
                    ) : member.site_access === 'all' ? (
                      <span className="text-sm text-muted-foreground">Tutti i siti</span>
                    ) : (
                      <span className="text-sm">
                        {member.assigned_sites_count || 0} siti
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {canManageMember(member) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.role !== 'owner' && member.role !== 'admin' && (
                            <DropdownMenuItem onClick={() => onSiteAccessClick(member)}>
                              <Globe className="h-4 w-4 mr-2" />
                              Gestisci accesso siti
                            </DropdownMenuItem>
                          )}
                          {getAvailableRoles(member).length > 0 && (
                            <>
                              <DropdownMenuSeparator />
                              {getAvailableRoles(member).map(role => (
                                <DropdownMenuItem
                                  key={role}
                                  onClick={() =>
                                    setMemberToChangeRole({ member, newRole: role })
                                  }
                                >
                                  <Settings className="h-4 w-4 mr-2" />
                                  Cambia in {roleLabels[role]}
                                </DropdownMenuItem>
                              ))}
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setMemberToRemove(member)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Rimuovi dal team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Remove Member Dialog */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={() => setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rimuovi membro</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler rimuovere{' '}
              <strong>{memberToRemove?.name || memberToRemove?.email}</strong> dal
              team? Questa azione non puo essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isUpdating}
              className="bg-red-600 hover:bg-red-700"
            >
              {isUpdating ? 'Rimozione...' : 'Rimuovi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Role Dialog */}
      <AlertDialog
        open={!!memberToChangeRole}
        onOpenChange={() => setMemberToChangeRole(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambia ruolo</AlertDialogTitle>
            <AlertDialogDescription>
              Vuoi cambiare il ruolo di{' '}
              <strong>
                {memberToChangeRole?.member.name || memberToChangeRole?.member.email}
              </strong>{' '}
              da <strong>{memberToChangeRole && roleLabels[memberToChangeRole.member.role]}</strong>{' '}
              a <strong>{memberToChangeRole && roleLabels[memberToChangeRole.newRole]}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangeRole} disabled={isUpdating}>
              {isUpdating ? 'Aggiornamento...' : 'Conferma'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
