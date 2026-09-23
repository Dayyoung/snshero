/**
 * AutoPoseAligner.tsx - SCR-09-20
 * 아바타들을 포디움에 자동 정렬하고 승리 포즈를 계산하는 헬퍼
 */

export interface GuildMemberAvatar {
  id: string;
  name: string;
  role: string;
  pose: 'cheer' | 'salute' | 'arms_crossed' | 'victory';
}

export class AutoPoseAligner {
  public static alignMembersOnPodium(members: { id: string; name: string; role: string }[]): GuildMemberAvatar[] {
    const poses: ('cheer' | 'salute' | 'arms_crossed' | 'victory')[] = [
      'victory',
      'cheer',
      'salute',
      'arms_crossed',
    ];

    return members.map((m, idx) => ({
      ...m,
      pose: poses[idx % poses.length],
    }));
  }
}
