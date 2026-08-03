export interface AvatarOption {
  id: string;
  name: string;
  url: string;
  gender: 'male' | 'female';
}

export const DEFAULT_3D_AVATARS: AvatarOption[] = [];

export function getDefaultAvatarUrl(identifier: string = 'User'): string {
  return '';
}
