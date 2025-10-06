import { Post } from "../types";

export const mapStatusToKorean = (status: Post['status'] | undefined | null): '실종' | '발견' | '귀가 완료' => {
    switch (status) {
      case 'MISSING':
        return '실종';
      case 'SIGHTED':
        return '발견';
      case 'RETURNED':
        return '귀가 완료';
      default:
        return '실종'; // 기본값
    }
  };

export const mapGenderToKorean = (gender: Post['gender'] | undefined | null): '수컷' | '암컷' | '알 수 없음' => {
  switch (gender) {
    case 'MALE':
      return '수컷';
    case 'FEMALE':
      return '암컷';
    default:
      return '알 수 없음';
  }
};

export const mapLostTypeToKorean = (lostType: string): string => {
  switch (lostType) {
    case 'LOST':
      return '실종';
    case 'FOUND':
      return '발견';
    default:
      return '귀가 완료';
  }
};